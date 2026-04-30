import type { GitHubSettings } from "@/types/beetle";

export async function pushDataToGitHub(settings: GitHubSettings, data: any) {
  const content = JSON.stringify(data, null, 2);
  const encodedContent = btoa(unescape(encodeURIComponent(content)));

  // 現在のファイルのSHAを取得する必要がある
  const getFileResponse = await fetch(
    `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.path}?ref=${settings.branch}`,
    {
      headers: {
        Authorization: `token ${settings.token}`,
      },
    }
  );

  let sha: string | undefined;
  if (getFileResponse.ok) {
    const fileData = await getFileResponse.json();
    sha = fileData.sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${settings.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update beetle data",
        content: encodedContent,
        branch: settings.branch,
        sha,
      }),
    }
  );

  return response.ok;
}
