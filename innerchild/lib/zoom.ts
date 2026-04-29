let cachedToken: { token: string; expiresAt: number } | null = null;

async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Zoom token error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function createZoomMeeting(params: {
  topic: string;
  startTime: string; // ISO 8601 e.g. "2026-04-01T10:00:00+08:00"
  durationMinutes: number;
}): Promise<{ joinUrl: string; startUrl: string; meetingId: number }> {
  const token = await getZoomAccessToken();

  const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2,
      start_time: params.startTime,
      duration: params.durationMinutes,
      timezone: "Asia/Ulaanbaatar",
      settings: {
        join_before_host: true,
        waiting_room: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Zoom API error: ${response.status} ${await response.text()}`);
  }

  const meeting = await response.json();
  return {
    joinUrl: meeting.join_url,
    startUrl: meeting.start_url,
    meetingId: meeting.id,
  };
}
