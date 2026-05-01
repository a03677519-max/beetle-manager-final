export async function pushDataToGitHub(
  config: { token: string; repo: string },
  data: any
) {
  const { token, repo } = config;
  const path = "data.json"; // 飼育データの保存先ファイル名
  const message = `Sync data: ${new Date().toISOString()}`;
  
  // UTF-8 文字列を Base64 に安全に変換
  const json = JSON.stringify(data, null, 2);
  const bytes = new TextEncoder().encode(json);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const content = btoa(binString);

  try {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
    
    // 1. ファイルの現在の状態（SHA）を取得（既存ファイルの更新に必要）
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const body = await getRes.json();
      sha = body.sha;
    }

    // 2. ファイルをプッシュ（作成または更新）
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content,
        sha,
      }),
    });

    return putRes.ok;
  } catch (error) {
    console.error("GitHub Sync Error:", error);
    return false;
  }
}