import { NextRequest } from "next/server"

// Helper: write a 32-bit big-endian integer into a Uint8Array at the given offset
function writeU32(arr: Uint8Array, offset: number, value: number) {
  arr[offset] = (value >> 24) & 0xff
  arr[offset + 1] = (value >> 16) & 0xff
  arr[offset + 2] = (value >> 8) & 0xff
  arr[offset + 3] = value & 0xff
}

// Helper: create an MP4 box from a 4-char type and payload bytes
function box(type: string, ...payloads: Uint8Array[]): Uint8Array {
  let contentLen = 0
  for (const p of payloads) contentLen += p.length
  const size = 8 + contentLen
  const result = new Uint8Array(size)
  writeU32(result, 0, size)
  result[4] = type.charCodeAt(0)
  result[5] = type.charCodeAt(1)
  result[6] = type.charCodeAt(2)
  result[7] = type.charCodeAt(3)
  let offset = 8
  for (const p of payloads) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}

// Generates a valid playable MP4 with a single-frame H.264 video track.
// The requested size is achieved by padding the mdat box with extra data.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sizeKB = Math.min(Math.max(parseInt(searchParams.get("size") || "500"), 10), 20000)
  const name = searchParams.get("name") || "video"
  const targetBytes = sizeKB * 1024

  const width = 320
  const height = 240
  const fps = 24
  const timescale = 12288
  const durationInFrames = Math.max(Math.round(fps * 5), 1) // 5 seconds
  const frameDuration = timescale / fps // 512

  // Minimal H.264 Baseline SPS (Sequence Parameter Set)
  // Profile IDC=66 (Baseline), Level=30, 320x240
  const sps = new Uint8Array([
    0x67, 0x42, 0x00, 0x1e, 0xe9, 0x40, 0x14, 0x09, 0xb8,
  ])

  // Minimal PPS (Picture Parameter Set)
  const pps = new Uint8Array([0x68, 0xce, 0x38, 0x80])

  // Minimal IDR slice (I-frame) – a single grey macroblock
  const idrSlice = new Uint8Array([
    0x65, 0x88, 0x80, 0x40, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00,
  ])

  // Build NAL units with Annex B start codes for mdat
  // Each NALU in mdat is length-prefixed (4-byte big-endian length)
  function naluWithLength(nalu: Uint8Array): Uint8Array {
    const result = new Uint8Array(4 + nalu.length)
    writeU32(result, 0, nalu.length)
    result.set(nalu, 4)
    return result
  }

  const spsNalu = naluWithLength(sps)
  const ppsNalu = naluWithLength(pps)
  const idrNalu = naluWithLength(idrSlice)

  // A single sample = SPS + PPS + IDR
  const singleSampleSize = spsNalu.length + ppsNalu.length + idrNalu.length

  // For subsequent frames, use a minimal P-frame (non-IDR)
  const pSlice = new Uint8Array([0x41, 0x9a, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00])
  const pNalu = naluWithLength(pSlice)

  // Build mdat content: 1 IDR frame + (durationInFrames-1) P-frames
  const sampleSizes: number[] = []
  const mdatChunks: Uint8Array[] = []

  // IDR frame (first frame)
  const idrFrame = new Uint8Array(spsNalu.length + ppsNalu.length + idrNalu.length)
  idrFrame.set(spsNalu, 0)
  idrFrame.set(ppsNalu, spsNalu.length)
  idrFrame.set(idrNalu, spsNalu.length + ppsNalu.length)
  mdatChunks.push(idrFrame)
  sampleSizes.push(idrFrame.length)

  // P-frames
  for (let i = 1; i < durationInFrames; i++) {
    mdatChunks.push(pNalu)
    sampleSizes.push(pNalu.length)
  }

  // Calculate real content size for mdat
  let mdatContentSize = 0
  for (const chunk of mdatChunks) mdatContentSize += chunk.length

  // Pad mdat to reach target file size (we'll calculate moov size first, then pad)
  // For now, build the moov box to know its size

  // --- Build moov box ---

  // avcC box content (inside avc1/stsd)
  const avcCPayload = new Uint8Array([
    0x01,       // configurationVersion
    sps[1],     // AVCProfileIndication (66 = Baseline)
    sps[2],     // profile_compatibility
    sps[3],     // AVCLevelIndication (30)
    0xff,       // lengthSizeMinusOne = 3 (4 bytes)
    0xe1,       // numOfSequenceParameterSets = 1
    // SPS length (2 bytes big-endian) + SPS data
    (sps.length >> 8) & 0xff, sps.length & 0xff,
    ...sps,
    0x01,       // numOfPictureParameterSets = 1
    // PPS length (2 bytes big-endian) + PPS data
    (pps.length >> 8) & 0xff, pps.length & 0xff,
    ...pps,
  ])
  const avcC = box("avcC", avcCPayload)

  // Visual sample entry: avc1
  const avc1Payload = new Uint8Array(78 + avcC.length)
  // reserved (6 bytes) + data_reference_index (2 bytes)
  avc1Payload[6] = 0; avc1Payload[7] = 1
  // width (2 bytes at offset 24)
  avc1Payload[24] = (width >> 8) & 0xff
  avc1Payload[25] = width & 0xff
  // height (2 bytes at offset 26)
  avc1Payload[26] = (height >> 8) & 0xff
  avc1Payload[27] = height & 0xff
  // horizontal resolution 72 dpi (offset 28, 4 bytes) = 0x00480000
  avc1Payload[28] = 0x00; avc1Payload[29] = 0x48; avc1Payload[30] = 0x00; avc1Payload[31] = 0x00
  // vertical resolution 72 dpi (offset 32, 4 bytes) = 0x00480000
  avc1Payload[32] = 0x00; avc1Payload[33] = 0x48; avc1Payload[34] = 0x00; avc1Payload[35] = 0x00
  // frame_count = 1 (offset 40)
  avc1Payload[40] = 0; avc1Payload[41] = 1
  // compressor name (32 bytes at offset 42) – leave zeros
  // depth = 24 (offset 74)
  avc1Payload[74] = 0x00; avc1Payload[75] = 0x18
  // pre-defined = -1 (offset 76)
  avc1Payload[76] = 0xff; avc1Payload[77] = 0xff
  // avcC
  avc1Payload.set(avcC, 78)
  const avc1 = box("avc1", avc1Payload)

  const stsd = box("stsd", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]), avc1)

  // stts (decoding time-to-sample)
  const sttsPayload = new Uint8Array(8)
  writeU32(sttsPayload, 0, 0) // version + flags
  writeU32(sttsPayload, 4, 1) // entry count
  const sttsEntry = new Uint8Array(8)
  writeU32(sttsEntry, 0, durationInFrames)
  writeU32(sttsEntry, 4, frameDuration)
  const stts = box("stts", sttsPayload, sttsEntry)

  // stss (sync sample - key frames)
  const stssPayload = new Uint8Array(8)
  writeU32(stssPayload, 4, 1) // 1 sync sample
  const stssEntry = new Uint8Array(4)
  writeU32(stssEntry, 0, 1) // sample 1 is sync
  const stss = box("stss", stssPayload, stssEntry)

  // stsz (sample sizes)
  const stszPayload = new Uint8Array(12)
  writeU32(stszPayload, 4, 0) // sample_size = 0 (variable)
  writeU32(stszPayload, 8, durationInFrames) // sample_count
  const stszEntries = new Uint8Array(durationInFrames * 4)
  for (let i = 0; i < durationInFrames; i++) {
    writeU32(stszEntries, i * 4, sampleSizes[i])
  }
  const stsz = box("stsz", stszPayload, stszEntries)

  // stsc (sample-to-chunk)
  const stscPayload = new Uint8Array(8)
  writeU32(stscPayload, 4, 1) // entry count
  const stscEntry = new Uint8Array(12)
  writeU32(stscEntry, 0, 1) // first_chunk
  writeU32(stscEntry, 4, durationInFrames) // samples_per_chunk
  writeU32(stscEntry, 8, 1) // sample_description_index
  const stsc = box("stsc", stscPayload, stscEntry)

  // stco (chunk offset) - will be patched after we know ftyp + mdat sizes
  const stcoPayload = new Uint8Array(8)
  writeU32(stcoPayload, 4, 1) // 1 chunk
  const stcoEntry = new Uint8Array(4)
  writeU32(stcoEntry, 0, 0) // placeholder - will patch
  const stco = box("stco", stcoPayload, stcoEntry)

  const stbl = box("stbl", stsd, stts, stss, stsz, stsc, stco)

  // dinf + dref
  const drefEntry = box("url ", new Uint8Array([0, 0, 0, 1])) // self-contained
  const dref = box("dref", new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]), drefEntry)
  const dinf = box("dinf", dref)

  // vmhd
  const vmhd = box("vmhd", new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]))

  const minf = box("minf", vmhd, dinf, stbl)

  // mdhd (media header)
  const totalDuration = durationInFrames * frameDuration
  const mdhdPayload = new Uint8Array(24)
  writeU32(mdhdPayload, 0, 0) // version + flags
  writeU32(mdhdPayload, 4, 0) // creation_time
  writeU32(mdhdPayload, 8, 0) // modification_time
  writeU32(mdhdPayload, 12, timescale)
  writeU32(mdhdPayload, 16, totalDuration) // duration
  // language: undetermined (0x55C4 = 'und')
  mdhdPayload[20] = 0x55; mdhdPayload[21] = 0xc4
  const mdhd = box("mdhd", mdhdPayload)

  // hdlr (handler)
  const hdlrPayload = new Uint8Array(25)
  writeU32(hdlrPayload, 0, 0) // version + flags
  // handler type 'vide' at offset 8
  hdlrPayload[8] = 0x76; hdlrPayload[9] = 0x69; hdlrPayload[10] = 0x64; hdlrPayload[11] = 0x65
  // name "v\0" (null-terminated string)
  hdlrPayload[24] = 0
  const hdlr = box("hdlr", hdlrPayload)

  const mdia = box("mdia", mdhd, hdlr, minf)

  // tkhd (track header)
  const tkhdPayload = new Uint8Array(84)
  // version=0, flags=3 (track_enabled | track_in_movie)
  tkhdPayload[3] = 3
  writeU32(tkhdPayload, 4, 0) // creation_time
  writeU32(tkhdPayload, 8, 0) // modification_time
  writeU32(tkhdPayload, 12, 1) // track_ID
  // duration in movie timescale
  const movieDuration = Math.round((totalDuration / timescale) * 1000)
  writeU32(tkhdPayload, 20, movieDuration)
  // matrix (identity) at offset 40
  writeU32(tkhdPayload, 40, 0x00010000) // a = 1.0
  writeU32(tkhdPayload, 56, 0x00010000) // d = 1.0
  writeU32(tkhdPayload, 68, 0x40000000) // w = 1.0
  // width and height in 16.16 fixed-point at offset 76
  writeU32(tkhdPayload, 76, width << 16)
  writeU32(tkhdPayload, 80, height << 16)
  const tkhd = box("tkhd", tkhdPayload)

  const trak = box("trak", tkhd, mdia)

  // mvhd (movie header)
  const mvhdPayload = new Uint8Array(100)
  writeU32(mvhdPayload, 0, 0) // version + flags
  writeU32(mvhdPayload, 12, 1000) // timescale (movie level)
  writeU32(mvhdPayload, 16, movieDuration) // duration
  writeU32(mvhdPayload, 20, 0x00010000) // rate = 1.0
  mvhdPayload[24] = 0x01; mvhdPayload[25] = 0x00 // volume = 1.0
  // matrix identity at offset 36
  writeU32(mvhdPayload, 36, 0x00010000) // a
  writeU32(mvhdPayload, 52, 0x00010000) // d
  writeU32(mvhdPayload, 64, 0x40000000) // w
  writeU32(mvhdPayload, 96, 2) // next_track_ID
  const mvhd = box("mvhd", mvhdPayload)

  const moov = box("moov", mvhd, trak)

  // --- Build ftyp ---
  const ftyp = new Uint8Array([
    0x00, 0x00, 0x00, 0x18, // size = 24
    0x66, 0x74, 0x79, 0x70, // 'ftyp'
    0x69, 0x73, 0x6f, 0x6d, // major_brand = 'isom'
    0x00, 0x00, 0x02, 0x00, // minor_version
    0x69, 0x73, 0x6f, 0x6d, // compatible: 'isom'
    0x61, 0x76, 0x63, 0x31, // compatible: 'avc1'
  ])

  // --- Build mdat ---
  // Pad mdat to reach target size
  const overhead = ftyp.length + moov.length + 8 // 8 = mdat box header
  const neededMdatContent = Math.max(mdatContentSize, targetBytes - overhead)
  const paddingSize = Math.max(neededMdatContent - mdatContentSize, 0)

  const mdatTotalSize = 8 + neededMdatContent
  const mdatHeader = new Uint8Array(8)
  writeU32(mdatHeader, 0, mdatTotalSize)
  mdatHeader[4] = 0x6d; mdatHeader[5] = 0x64; mdatHeader[6] = 0x61; mdatHeader[7] = 0x74

  // Patch stco: chunk offset = ftyp.length + 8 (mdat header)
  const chunkOffset = ftyp.length + 8
  // Find stco entry in moov and patch it
  // stco entry is at the end of the stco box, 4 bytes from the end of moov
  // We need to find it. Let's locate it by searching for 'stco' in moov.
  for (let i = 0; i < moov.length - 4; i++) {
    if (moov[i] === 0x73 && moov[i + 1] === 0x74 && moov[i + 2] === 0x63 && moov[i + 3] === 0x6f) {
      // stco found at i, the box header is at i-4
      // version+flags at i+4 (4 bytes), entry_count at i+8 (4 bytes), first entry at i+12 (4 bytes)
      writeU32(moov, i + 12, chunkOffset)
      break
    }
  }

  // Assemble final file: ftyp + mdat + moov
  // Wait, for better compatibility: ftyp + mdat(content + padding) + moov
  const totalSize = ftyp.length + mdatTotalSize + moov.length
  const output = new Uint8Array(totalSize)
  let pos = 0

  output.set(ftyp, pos); pos += ftyp.length
  output.set(mdatHeader, pos); pos += mdatHeader.length
  for (const chunk of mdatChunks) {
    output.set(chunk, pos); pos += chunk.length
  }
  // Fill padding with zeros (or random for size)
  if (paddingSize > 0) {
    const padding = new Uint8Array(paddingSize) // zeros
    const chunkSize = 65536
    for (let i = 0; i < paddingSize; i += chunkSize) {
      const end = Math.min(i + chunkSize, paddingSize)
      crypto.getRandomValues(padding.subarray(i, end))
    }
    output.set(padding, pos); pos += paddingSize
  }
  output.set(moov, pos)

  return new Response(output, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `inline; filename="${name}.mp4"`,
      "Content-Length": String(output.byteLength),
      "Accept-Ranges": "bytes",
    },
  })
}
