export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: req.body.messages,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        // Send TinyMCE key with the response
        res.status(200).json({
            ...data,
            tinymceKey: process.env.TINYMCE_KEY
        });

    } catch (error) {
        console.error("API error:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
}
