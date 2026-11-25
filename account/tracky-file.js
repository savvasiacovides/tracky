// Reads what /account/ shows of a session from the session's own file, the copy Tracky Pro keeps in
// the driver's account (media worker, s/<id>/…). Nothing is worked out here that the app did not
// write: the summary and the insights (laps, sectors, top speed, distance, outline) are the app's.
//
// Files are packed by the app (Sources/TelemetryCore/SyncPacking.swift): "TRKZ", the unpacked length
// (UInt64 LE), a CRC-32, then raw deflate. Unpacked, a session file (SessionArchive.swift) is "TRACKY01",
// the JSON header's length (UInt64 LE), then the JSON header. Only the start of the file is needed.
(function (root) {
  "use strict";
  var MAGIC_PACK = [0x54, 0x52, 0x4b, 0x5a];            // TRKZ
  var MAGIC_FILE = "TRACKY01";
  var HEADER_LIMIT = 8 * 1024 * 1024;

  function u64(bytes, at) {
    var lo = bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24) >>> 0;
    var hi = bytes[at + 4] | (bytes[at + 5] << 8) | (bytes[at + 6] << 16) | (bytes[at + 7] << 24) >>> 0;
    return (lo >>> 0) + hi * 4294967296;
  }
  function isPacked(b) { return b.length >= 16 && MAGIC_PACK.every(function (v, i) { return b[i] === v; }); }

  // Inflates as much of `body` as is needed for `want` bytes; a cut-off stream is fine.
  async function inflate(body, want) {
    var ds = new DecompressionStream("deflate-raw");
    var writer = ds.writable.getWriter();
    writer.write(body).catch(function () {});
    writer.close().catch(function () {});
    writer.closed.catch(function () {});
    var reader = ds.readable.getReader(), parts = [], have = 0;
    try {
      while (have < want) {
        var r = await reader.read();
        if (r.done) break;
        parts.push(r.value); have += r.value.length;
      }
    } catch (e) { /* a prefix of the stream ends in an error once its end is reached */ }
    try { reader.cancel(); } catch (e) {}
    var out = new Uint8Array(have), at = 0;
    parts.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }

  // The header from the first bytes of a (packed or plain) session file. Returns null when the
  // prefix is too short to hold it (the caller then asks for the whole file).
  async function header(prefix) {
    var bytes = new Uint8Array(prefix), plain;
    if (isPacked(bytes)) plain = await inflate(bytes.subarray(16), HEADER_LIMIT + 16);
    else plain = bytes;
    if (plain.length < 16) return null;
    var magic = String.fromCharCode.apply(null, plain.subarray(0, 8));
    if (magic !== MAGIC_FILE) {
      // A session from before the binary format: JSON from the first byte.
      if (plain[0] === 0x7b) { try { return { legacy: JSON.parse(new TextDecoder().decode(plain)) }; } catch (e) { return null; } }
      throw new Error("Not a Tracky session file");
    }
    var length = u64(plain, 8);
    if (length <= 0 || length > HEADER_LIMIT) throw new Error("Session header is damaged");
    if (plain.length < 16 + length) return null;
    return JSON.parse(new TextDecoder().decode(plain.subarray(16, 16 + length)));
  }

  // What a page shows of one session.
  function describe(h) {
    if (h.legacy) {
      var s0 = h.legacy, i0 = (s0.metadata || {})["tracky.insights"] || null;
      return shape({ id: s0.id, title: s0.title }, i0);
    }
    var meta = (h.session && h.session.metadata) || {};
    return shape(h.summary || {}, meta["tracky.insights"] || null, (h.session && h.session.channels || []).length);
  }
  function shape(summary, ins, channels) {
    ins = ins || {};
    var laps = (ins.laps || []).map(function (l) {
      return { number: l.number, ms: l.endMs - l.startMs, startMs: l.startMs, sectors: l.sectorsMs || null, top: l.topSpeedMps || null, invalid: !!l.invalid };
    });
    var valid = laps.filter(function (l) { return !l.invalid && l.ms > 0; });
    var best = valid.length ? Math.min.apply(null, valid.map(function (l) { return l.ms; })) : (summary.bestLapMs || null);
    return {
      id: summary.id || null,
      title: summary.title || "",
      track: ins.trackName || null,
      trackID: ins.trackID || null,
      name: ins.name || null,
      notes: ins.notes || null,
      car: ins.carName || null,
      driver: ins.driverName || null,
      startedAt: ins.startedAtUnixMs || summary.startTimeMs || null,
      durationMs: ins.durationMs || ((summary.endTimeMs || 0) - (summary.startTimeMs || 0)) || null,
      distanceM: ins.distanceM || null,
      topSpeedMps: ins.topSpeedMps || null,
      optimalMs: ins.optimalLapMs || null,
      sectorCount: ins.sectorCount || 0,
      gpsRateHz: ins.gpsRateHz || null,
      gpsSource: ins.gpsSource || null,
      engine: !!ins.hasEngineData,
      outline: ins.outline || [],
      isCourse: !!ins.isCourse,
      laps: laps,
      bestMs: best,
      lapCount: summary.lapCount != null ? summary.lapCount : laps.length,
      channels: channels || null
    };
  }

  root.TrackyFile = { header: header, describe: describe, isPacked: isPacked };
})(typeof window !== "undefined" ? window : globalThis);
