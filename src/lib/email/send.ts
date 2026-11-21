import "server-only"

type OutboundEmail = {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail(message: OutboundEmail) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[diba-email] to=${message.to} subject=${message.subject}\n${message.text}`)
    return { delivered: false as const }
  }
  const from = process.env.EMAIL_FROM || "Diba Meals <orders@dibameals.test>"
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  })
  if (!response.ok) {
    console.log(`[diba-email] resend ${response.status} to=${message.to} subject=${message.subject}`)
    return { delivered: false as const }
  }
  return { delivered: true as const }
}
