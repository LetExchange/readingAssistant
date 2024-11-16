class ReaderHelper {
  constructor() {
    this.sidebar = null;
    this.isOpen = false;
    this.isDarkMode = false;
    this.toggleButton = null;
    this.isButtonVisible = false;
    this.init();
  }

  async init() {
    try {
      // 确保在DOM加载完成后再初始化
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.initializeElements()
        );
      } else {
        await this.initializeElements();
      }
    } catch (error) {
      console.error("初始化失败:", error);
    }
  }

  async initializeElements() {
    try {
      this.createSidebar();
      this.createToggleButton();
      this.setupMessageListener();
      this.bindEvents();

      // 从存储中获取状态并设置按钮显示
      const result = await chrome.storage.local.get(["readerEnabled"]);
      if (result.readerEnabled) {
        this.toggleButton.style.display = "block";
        this.isButtonVisible = true;
      } else {
        this.toggleButton.style.display = "none";
        this.isButtonVisible = false;
      }
    } catch (error) {
      console.error("元素初始化失败:", error);
    }
  }

  createSidebar() {
    if (!document.body) return;

    this.sidebar = document.createElement("div");
    this.sidebar.className = "reader-sidebar";

    const controls = `
      <div class="reader-controls">
        <button id="fontIncrease">放大字体</button>
        <button id="fontDecrease">缩小字体</button>
        <button id="toggleDarkMode">夜间模式</button>
      </div>
      <div class="reader-content"></div>
    `;

    this.sidebar.innerHTML = controls;
    document.body.appendChild(this.sidebar);
  }

  createToggleButton() {
    if (!document.body) return;

    this.toggleButton = document.createElement("div");
    this.toggleButton.className = "reader-toggle";
    this.toggleButton.textContent = "阅读助手";
    document.body.appendChild(this.toggleButton);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleButton") {
        this.toggleButton.style.display = request.enabled ? "block" : "none";
        this.isButtonVisible = request.enabled;
      }
      return true;
    });
  }

  bindEvents() {
    if (!this.toggleButton) return;

    this.toggleButton.addEventListener("click", () => {
      this.toggleSidebar();
    });

    const darkModeBtn = document.getElementById("toggleDarkMode");
    if (darkModeBtn) {
      darkModeBtn.addEventListener("click", () => {
        this.toggleDarkMode();
      });
    }

    const fontIncreaseBtn = document.getElementById("fontIncrease");
    if (fontIncreaseBtn) {
      fontIncreaseBtn.addEventListener("click", () => {
        this.changeFontSize(2);
      });
    }

    const fontDecreaseBtn = document.getElementById("fontDecrease");
    if (fontDecreaseBtn) {
      fontDecreaseBtn.addEventListener("click", () => {
        this.changeFontSize(-2);
      });
    }
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.sidebar.classList.toggle("open");
    if (this.isOpen) {
      this.extractContent();
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.sidebar.classList.toggle("dark-mode");
  }

  changeFontSize(delta) {
    const content = document.querySelector(".reader-content");
    const currentSize = parseInt(window.getComputedStyle(content).fontSize);
    content.style.fontSize = currentSize + delta + "px";
  }

  extractContent() {
    // 获取主要内容区域
    const possibleContentSelectors = [
      "article",
      '[role="main"]',
      ".article-content",
      ".post-content",
      ".content",
      "main",
      "#content",
      ".main-content",
    ];

    let mainContent = null;
    for (const selector of possibleContentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element;
        break;
      }
    }

    if (!mainContent) {
      mainContent = this.findLargestTextBlock(document.body);
    }

    let content = "";

    // 提取标题
    const title = document.querySelector("h1") || document.title;
    content += `<h1>${title}</h1>`;

    // 提取正文内容
    const textNodes = this.extractTextContent(mainContent);
    content += textNodes;

    document.querySelector(".reader-content").innerHTML = content;
  }

  // 添加新方法：查找最大文本块
  findLargestTextBlock(root) {
    let maxLength = 0;
    let largestBlock = null;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (node) {
        // 排除脚本、样式、导航、页脚等
        const excludeTags = ["SCRIPT", "STYLE", "NAV", "FOOTER", "HEADER"];
        if (excludeTags.includes(node.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent.trim();
      if (text.length > maxLength) {
        maxLength = text.length;
        largestBlock = node;
      }
    }

    return largestBlock;
  }

  // 添加新方法：提取文本内容
  extractTextContent(element) {
    if (!element) return "";

    let content = "";
    const validElements = element.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, li"
    );

    validElements.forEach((el) => {
      const text = el.textContent.trim();
      if (text.length < 10) return; // 忽略过短的文本

      // 根据标签类型添加适当的HTML标记
      switch (el.tagName.toLowerCase()) {
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          content += `<${el.tagName.toLowerCase()}>${text}</${el.tagName.toLowerCase()}>`;
          break;
        case "li":
          content += `<li>${text}</li>`;
          break;
        default:
          content += `<p>${text}</p>`;
      }
    });

    return content;
  }
}

// 等待DOM加载完成后再初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new ReaderHelper();
  });
} else {
  new ReaderHelper();
}
