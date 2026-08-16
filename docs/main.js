(function () {
  "use strict";

  var LANGUAGES = ["en", "ja", "zh", "es", "ru"];
  var DEFAULT_LANGUAGE = "en";
  var STORAGE_KEY = "memory-mcp-lang";

  var META = {
    en: {
      title: "Memory MCP Server — Local Memory for Claude Desktop",
      description: "A locally running memory management MCP server for Claude Desktop. Remember user preferences, interests, and personal context across conversations — all stored on your machine."
    },
    ja: {
      title: "Memory MCP サーバー — Claude Desktop向けローカルメモリ",
      description: "Claude Desktop向けにローカルで動作するメモリ管理MCPサーバー。ユーザーの好み・興味・個人的な文脈を、会話をまたいで自分のマシン上だけに記憶します。"
    },
    zh: {
      title: "Memory MCP 服务器 — Claude Desktop 本地记忆",
      description: "一款在本地运行的 Claude Desktop 记忆管理 MCP 服务器。跨对话记住用户偏好、兴趣和个人上下文 — 全部保存在你自己的电脑上。"
    },
    es: {
      title: "Memory MCP Server — Memoria local para Claude Desktop",
      description: "Un servidor MCP de gestión de memoria que se ejecuta localmente para Claude Desktop. Recuerda preferencias, intereses y contexto personal del usuario entre conversaciones, todo almacenado en tu máquina."
    },
    ru: {
      title: "Memory MCP Server — локальная память для Claude Desktop",
      description: "Локально работающий MCP-сервер управления памятью для Claude Desktop. Запоминает предпочтения, интересы и личный контекст пользователя между беседами — всё хранится на вашем компьютере."
    }
  };

  function detectLanguage() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.indexOf(stored) !== -1) return stored;

    var nav = (navigator.language || DEFAULT_LANGUAGE).toLowerCase().slice(0, 2);
    return LANGUAGES.indexOf(nav) !== -1 ? nav : DEFAULT_LANGUAGE;
  }

  function applyMeta(lang) {
    var meta = META[lang] || META[DEFAULT_LANGUAGE];
    document.title = meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
  }

  function setLanguage(ml, lang) {
    ml.setLanguage(lang);
    applyMeta(lang);
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem(STORAGE_KEY, lang);
    var select = document.getElementById("lang-select");
    if (select) select.value = lang;
  }

  function initCopyButtons() {
    var buttons = document.querySelectorAll(".copy-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-copy-target");
        var target = document.getElementById(targetId);
        if (!target) return;

        navigator.clipboard.writeText(target.textContent).then(function () {
          btn.classList.add("copied");
          setTimeout(function () {
            btn.classList.remove("copied");
          }, 1500);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var ml = new MultilanguageJS({
      languages: LANGUAGES,
      defaultLanguage: DEFAULT_LANGUAGE
    });

    var lang = detectLanguage();
    setLanguage(ml, lang);

    var select = document.getElementById("lang-select");
    if (select) {
      select.addEventListener("change", function () {
        setLanguage(ml, select.value);
      });
    }

    initCopyButtons();
  });
})();
