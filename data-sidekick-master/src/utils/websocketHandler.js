import WebSocket from 'ws'

export const setupWebSocket = (ws) => {
    console.log('[WebSocket] Twilio connected to /media-stream')

    // Connect to ElevenLabs with the specific agent ID
    const elevenWs = new WebSocket('wss://api.elevenlabs.io/v1/convai/conversation?agent_id=fKxqfJuvKW4iYvBUtvVv', {
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }
    })

    // When we receive audio packets from Twilio, forward them to ElevenLabs
    ws.on('message', (rawMsg) => {
        const twilioData = JSON.parse(rawMsg.toString())
        if (twilioData.event === 'media') {
            // This is raw audio from Twilio, base64-encoded
            elevenWs.send(
                JSON.stringify({
                    user_audio_chunk: twilioData.media.payload
                })
            )
        }
    })

    // When we receive audio from ElevenLabs, send it back to Twilio
    elevenWs.on('message', (rawElevenMsg) => {
        const msg = JSON.parse(rawElevenMsg.toString())
        if (msg.type === 'audio' && msg.audio_event?.audio_base_64) {
            ws.send(
                JSON.stringify({
                    event: 'media',
                    streamSid: 'TODO-STREAM-SID',
                    media: { payload: msg.audio_event.audio_base_64 }
                })
            )
        }
    })

    // Clean up on close
    ws.on('close', () => elevenWs.close())
    elevenWs.on('close', () => ws.close())
}
