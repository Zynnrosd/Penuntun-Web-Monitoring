export async function kirimNotifikasiWhatsApp(nomorTujuan: string, pesan: string) {
  try {
    const res = await fetch("https://api.whatsapp-gateway-provider.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({ to: nomorTujuan, message: pesan }),
    });
    return res.ok ? "SENT" : "FAILED";
  } catch {
    return "FAILED";
  }
}