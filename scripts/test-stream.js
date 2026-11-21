async function checkStream() {
  const streamUrl = 'https://netshiftstudiokit.online:5443/LiveApp/streams/mopc_main.m3u8';
  console.log(`Checking HLS stream: ${streamUrl}`);
  try {
    const res = await fetch(streamUrl);
    console.log(`Stream HTTP status: ${res.status}`);
    const text = await res.text();
    console.log(`First 200 chars of playlist:\n${text.substring(0, 200)}`);
  } catch(e) {
    console.error('Stream check failed:', e.message);
  }
}

checkStream();
