import fetch from 'node-fetch';

async function testGeminiAPI() {
  const apiKey = 'AIzaSyBTAYqrMpZYcVjzFTW9V9RH-IWDacEzXRo';
  
  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  ];

  for (const url of urls) {
    try {
      console.log(`Testing: ${url.split('?')[0]}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });
      
      console.log(`Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success!');
        break;
      } else {
        console.log('❌ Failed');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---');
  }
}

testGeminiAPI();