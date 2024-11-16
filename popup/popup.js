document.addEventListener("DOMContentLoaded", async () => {
  const switchElement = document.getElementById("readerSwitch");

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 从存储中获取状态
  const result = await chrome.storage.local.get(["readerEnabled"]);
  const isEnabled = result.readerEnabled || false;

  // 设置开关状态
  switchElement.checked = isEnabled;

  // 监听开关变化
  switchElement.addEventListener("change", async (e) => {
    const isChecked = e.target.checked;

    // 保存状态到存储
    await chrome.storage.local.set({ readerEnabled: isChecked });

    // 向content script发送消息
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "toggleButton",
        enabled: isChecked,
      });
    } catch (error) {
      console.log("Error sending message:", error);
    }
  });
});
