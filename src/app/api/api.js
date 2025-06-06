// Replace this with actual deployment later
let url = 'https://sidewalkapi-278558760994.us-east4.run.app'
// *** Might have to mess with CORS here or in app.py

export async function predictTraffic(imageFile) {
    const formData = new FormData()
    formData.append('image', imageFile)

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Traffic Prediction failed')
        }

        const result = await response.json()
        return result.trafficPrediction
    } catch (error) {
        console.error('Traffic prediction error', error)
        throw error;
    }
}

export async function predictCar(imageFile) {
    const formData = new FormData()
    formData.append('image', imageFile)

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Car Prediction failed')
        }

        const result = await response.json()
        return result.carPrediction
    } catch (error) {
        console.error('Car prediction error', error)
        throw error;
    }
}

// Expected Usage: const audioUrl = await textToSpeech("Hello")
// const audio = new Audio(audioURL)
// audio.play()
export async function textToSpeech(text) {
    try {
        const response = await fetch(url + 'tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Text-to-speech failed')
        }

        const audioBlob = await response.blob()
        return URL.createObjectURL(audioBlob) // Used in html as <audio>
    } catch (error) {
        console.error('Text-to-speech error:', error)
        throw error
    }
}
