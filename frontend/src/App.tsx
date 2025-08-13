import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  Terminal,
  Code2,
  FileCode2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlignLeft,
  Search,
  BookType,
  ChevronRight,
  ChevronDown,
  Settings,
  StickyNote,
  Eye,
  Edit3,
  ChevronUp,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  MessageCircle,
  Send,
  X,
  Key,
  Save,
  FolderOpen,
  Plus,
  Trash2,
  FileCode,
  StopCircle,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./App.css";
import {
  RunCode,
  FormatCode,
  SelectWorkspaceFolder,
  LoadExamplesFromFolder,
  SaveExampleToFolder,
  DeleteExampleFromFolder,
  CreateWorkspaceTemplate,
} from "../wailsjs/go/app/App";
import { setupGoIntellisense } from "./goIntellisense";
import {
  codeExamples,
  categories,
  searchExamples,
  loadAllExamples,
  type CodeExample,
} from "./examples";
import { GoSettings } from "./components/GoSettings";

function App() {
  const [code, setCode] = useState(`package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Basics"]),
  );
  const [currentExample, setCurrentExample] = useState<CodeExample | null>(
    null,
  );
  const [examples, setExamples] = useState<CodeExample[]>(codeExamples);
  const [editorWidth, setEditorWidth] = useState(50); // Percentual do editor (50%)
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [notesHeight, setNotesHeight] = useState(50); // Percentual da altura das anotações (50% inicialmente)
  const [notesOpen, setNotesOpen] = useState(true);
  const [notesFullscreen, setNotesFullscreen] = useState(false);
  const [notesMode, setNotesMode] = useState<"edit" | "preview">("preview");
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [consoleAutoHide, setConsoleAutoHide] = useState(true);
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [consoleHover, setConsoleHover] = useState(false);
  const [chatWidth, setChatWidth] = useState(450); // Largura do chat em pixels (aumentado de 384px)
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(200); // Altura do console em pixels
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      content: string;
      type: "user" | "ai";
      timestamp: Date;
    }>
  >([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goSettingsOpen, setGoSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("openai");
  const [openaiToken, setOpenaiToken] = useState(() => {
    return localStorage.getItem("openai_token") || "";
  });
  const [workspacePath, setWorkspacePath] = useState(() => {
    return localStorage.getItem("workspace_path") || "";
  });
  const [isCustomWorkspace, setIsCustomWorkspace] = useState(() => {
    return localStorage.getItem("use_custom_workspace") === "true";
  });
  const [notesContent, setNotesContent] = useState(`# Code Documentation

## Description
This is a simple Go program that prints "Hello, World!" to the console.

## How it works
1. The \`main\` package defines the program's entry point
2. The \`main()\` function is executed automatically
3. \`fmt.Println()\` prints the text to the console

## Notes
- Use this space to document your code
- Supports full **Markdown** with GFM syntax
- Annotations will be saved per file`);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const notesEditorRef = useRef<any>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      handleFormat();
    });

    // Focus the editor
    editor.focus();
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Compiling and running...");
    setExecutionTime(null);

    // Show console when running code
    if (consoleAutoHide) {
      setConsoleVisible(true);
      // Clear any existing hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    }

    const startTime = performance.now();

    try {
      const result = await RunCode(code);
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setOutput(result);

      // Auto-hide console after 5 seconds
      if (consoleAutoHide) {
        hideTimeoutRef.current = setTimeout(() => {
          if (!consoleHover) {
            setConsoleVisible(false);
          }
        }, 5000);
      }
    } catch (error) {
      setOutput(`Error: ${error}`);

      // Auto-hide console after 8 seconds for errors (longer time)
      if (consoleAutoHide) {
        hideTimeoutRef.current = setTimeout(() => {
          if (!consoleHover) {
            setConsoleVisible(false);
          }
        }, 8000);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleFormat = async () => {
    if (isFormatting) return;

    setIsFormatting(true);
    try {
      const formattedCode = await FormatCode(code);
      setCode(formattedCode);

      // If editor is available, update its value and format
      if (editorRef.current) {
        editorRef.current.setValue(formattedCode);
        editorRef.current.getAction("editor.action.formatDocument").run();
      }
    } catch (error) {
      console.error("Formatting error:", error);
    } finally {
      setIsFormatting(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const loadExample = (example: CodeExample) => {
    setCode(example.code);
    setCurrentExample(example);
    setNotesContent(
      example.instruction || `# ${example.title}\n\n${example.description}`,
    );
    if (editorRef.current) {
      editorRef.current.setValue(example.code);
    }
  };

  const filteredExamples = searchExamples(
    examples,
    searchQuery,
    selectedCategory,
  );
  const examplesByCategory = filteredExamples.reduce(
    (acc, example) => {
      if (!acc[example.category]) {
        acc[example.category] = [];
      }
      acc[example.category].push(example);
      return acc;
    },
    {} as Record<string, CodeExample[]>,
  );

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const sidebarControlWidth = 48; // Width of the control bar
      const sidebarWidth = sidebarOpen ? 320 : 0; // Width of the sidebar
      const totalSidebarWidth = sidebarControlWidth + sidebarWidth;

      // Calculate the new width as a percentage
      const newWidth =
        ((e.clientX - container.left - totalSidebarWidth) /
          (container.width - totalSidebarWidth)) *
        100;

      // Limit the width between 25% and 75% to ensure console is always visible
      const clampedWidth = Math.max(25, Math.min(75, newWidth));
      setEditorWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Add a class to prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, sidebarOpen]);

  // Handle vertical mouse move for resizing notes
  useEffect(() => {
    const handleVerticalMouseMove = (e: MouseEvent) => {
      if (!isDraggingVertical || !editorPanelRef.current) return;

      const panel = editorPanelRef.current.getBoundingClientRect();

      // Calculate the new height in pixels (converted to our scale factor)
      const newHeightPx = e.clientY - panel.top;
      const newHeight = Math.round(newHeightPx / 6); // Convert to our scale factor

      // Limit the height between 20 and 66 (120px to 400px)
      const clampedHeight = Math.max(20, Math.min(66, newHeight));
      setNotesHeight(clampedHeight);
    };

    const handleVerticalMouseUp = () => {
      setIsDraggingVertical(false);
    };

    if (isDraggingVertical) {
      document.addEventListener("mousemove", handleVerticalMouseMove);
      document.addEventListener("mouseup", handleVerticalMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleVerticalMouseMove);
      document.removeEventListener("mouseup", handleVerticalMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingVertical]);

  // Handle chat width resize
  useEffect(() => {
    const handleChatResize = (e: MouseEvent) => {
      if (!isDraggingChat) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Limit chat width between 300px and 800px
      const clampedWidth = Math.max(300, Math.min(800, newWidth));
      setChatWidth(clampedWidth);
    };

    const handleChatMouseUp = () => {
      setIsDraggingChat(false);
    };

    if (isDraggingChat) {
      document.addEventListener("mousemove", handleChatResize);
      document.addEventListener("mouseup", handleChatMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleChatResize);
      document.removeEventListener("mouseup", handleChatMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingChat]);

  // Handle console height resize
  useEffect(() => {
    const handleConsoleResize = (e: MouseEvent) => {
      if (!isDraggingConsole) return;
      
      const newHeight = window.innerHeight - e.clientY - 40; // 40px for status bar
      // Limit console height between 100px and 500px
      const clampedHeight = Math.max(100, Math.min(500, newHeight));
      setConsoleHeight(clampedHeight);
    };

    const handleConsoleMouseUp = () => {
      setIsDraggingConsole(false);
    };

    if (isDraggingConsole) {
      document.addEventListener("mousemove", handleConsoleResize);
      document.addEventListener("mouseup", handleConsoleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleConsoleResize);
      document.removeEventListener("mouseup", handleConsoleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDraggingConsole]);

  // Load examples on mount
  useEffect(() => {
    const loadExamples = async () => {
      try {
        // Check if custom workspace is enabled
        if (isCustomWorkspace && workspacePath) {
          console.log("Loading examples from custom workspace:", workspacePath);
          const customExamples = await LoadExamplesFromFolder(workspacePath);
          if (customExamples.length > 0) {
            setExamples(customExamples);
            return;
          }
        }

        // Fallback to default examples
        const defaultExamples = await loadAllExamples();
        if (defaultExamples.length > 0) {
          setExamples(defaultExamples);
        }
      } catch (error) {
        console.error("Error loading examples:", error);
        // Fallback to hardcoded examples if everything fails
      }
    };

    loadExamples();
  }, [isCustomWorkspace, workspacePath]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      // Cmd+Enter or Ctrl+Enter to run
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleRun();
      }
      // Cmd+F or Ctrl+F to format (only if editor is not focused to avoid conflict)
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "f" &&
        event.target !== editorRef.current?.getDomNode()
      ) {
        event.preventDefault();
        handleFormat();
      }
    };

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, [code, isRunning, isFormatting]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isAiThinking]);

  // Chat functions
  const sendToOpenAI = async (
    userMessage: string,
    messages: Array<{ content: string; type: "user" | "ai" }>,
  ) => {
    if (!openaiToken) {
      throw new Error("OpenAI token not configured");
    }

    // Build context for the AI based on active block
    const documentContext = notesOpen ? `
# Current Document Context - Notes Mode

## File: ${currentExample ? currentExample.title : "main.go"}
${currentExample ? `**Category:** ${currentExample.category}` : ""}

## Documentation/Notes (Main Context):
${notesContent}

## Related Go Code:
\`\`\`go
${code}
\`\`\`

${output
        ? `## Last Execution:
\`\`\`
${output}
\`\`\``
        : ""
      }
` : `
# Current Document Context - Code Mode

## File: ${currentExample ? currentExample.title : "main.go"}
${currentExample ? `**Category:** ${currentExample.category}` : ""}

## Go Code (Main Context):
\`\`\`go
${code}
\`\`\`

${output
        ? `## Last Execution:
\`\`\`
${output}
\`\`\``
        : ""
      }

## Related Documentation/Notes:
${notesContent}
`;

    // Build conversation history
    const conversationHistory = messages.map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // Build the full prompt
    const systemPrompt = `You are a Go (Golang) expert assistant integrated into RunGo Playground. 

Your role is:
- Help the user with questions about the current Go code
- Explain Go programming concepts
- Suggest improvements and fixes
- Analyze compilation/runtime errors
- Teach Go best practices

Current context:
${documentContext}

Instructions:
- Be concise and educational
- Use practical examples when appropriate
- If referencing code, use correct Go syntax
- Always respond in English
- Keep focus on the provided code and documentation`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiToken}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: chatMessage.trim(),
      type: "user" as const,
      timestamp: new Date(),
    };

    // Add user message
    setChatMessages((prev) => [...prev, userMessage]);
    const currentMessages = [...chatMessages, userMessage];
    setChatMessage("");

    // Show AI thinking indicator
    setIsAiThinking(true);

    try {
      // Call OpenAI API
      const aiResponse = await sendToOpenAI(userMessage.content, chatMessages);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        type: "ai" as const,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: `❌ Error: ${error instanceof Error ? error.message : "Failed to communicate with AI"}. Please check if your OpenAI token is properly configured in settings.`,
        type: "ai" as const,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const draculaTheme = {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "comment", foreground: "6272a4", fontStyle: "italic" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "string", foreground: "f1fa8c" },
      { token: "number", foreground: "bd93f9" },
      { token: "type", foreground: "8be9fd" },
      { token: "function", foreground: "50fa7b" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "constant", foreground: "bd93f9" },
      { token: "delimiter", foreground: "f8f8f2" },
      { token: "operator", foreground: "ff79c6" },
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#44475a",
      "editor.selectionBackground": "#44475a",
      "editorCursor.foreground": "#f8f8f2",
      "editorWhitespace.foreground": "#6272a4",
      "editorIndentGuide.background": "#44475a",
      "editorLineNumber.foreground": "#6272a4",
      "editorGutter.background": "#282a36",
      "editor.inactiveSelectionBackground": "#44475a",
      "editorSuggestWidget.background": "#282a36",
      "editorSuggestWidget.border": "#6272a4",
      "editorSuggestWidget.foreground": "#f8f8f2",
      "editorSuggestWidget.selectedBackground": "#44475a",
      "editorSuggestWidget.highlightForeground": "#8be9fd",
      "editorHoverWidget.background": "#282a36",
      "editorHoverWidget.border": "#6272a4",
    },
  };

  const getStatusIcon = () => {
    if (isRunning) return <Loader2 className="w-3 h-3 animate-spin" />;
    if (output.includes("Error"))
      return <XCircle className="w-3 h-3 text-dracula-red" />;
    if (output && !output.includes('Click "Run"'))
      return <CheckCircle2 className="w-3 h-3 text-dracula-green" />;
    return <Clock className="w-3 h-3 text-dracula-comment" />;
  };

  return (
    <div className="h-screen bg-dracula-bg text-dracula-fg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-dracula-bg px-4 py-2 flex items-center justify-between border-b border-dracula-comment">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-dracula-purple" />
            <h1 className="text-xl font-bold text-dracula-purple">
              RunGo Playground
            </h1>
          </div>
          <div className="flex items-center space-x-3 text-xs text-dracula-comment">
            <span>
              Press{" "}
              <kbd className="px-1 py-0.5 bg-dracula-bg rounded text-dracula-cyan">
                Ctrl+Space
              </kbd>{" "}
              for suggestions
            </span>
            <span>
              Press{" "}
              <kbd className="px-1 py-0.5 bg-dracula-bg rounded text-dracula-green">
                ⌘+Enter
              </kbd>{" "}
              to run
            </span>
            <span>
              Press{" "}
              <kbd className="px-1 py-0.5 bg-dracula-bg rounded text-dracula-yellow">
                ⌘+F
              </kbd>{" "}
              to format
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {executionTime !== null && (
            <span className="text-xs text-dracula-comment flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {executionTime}ms
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-4 py-1.5 bg-dracula-green text-dracula-bg font-semibold rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run
                </>
              )}
            </button>
            {isRunning && (
              <button
                onClick={() => {
                  // Cancel the running operation
                  setIsRunning(false);
                  setOutput("Execution canceled by user");
                  setExecutionTime(null);
                }}
                className="px-4 py-1.5 bg-dracula-red text-dracula-bg font-semibold rounded hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                title="Cancel execution"
              >
                <StopCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className="flex-1 flex relative min-h-0 overflow-hidden"
      >
        {/* Sidebar Control Bar */}
        <div className="w-12 bg-dracula-bg border-r border-dracula-comment flex flex-col items-center h-full relative">
          {/* Go Button - Create new playground */}
          <button
            onClick={() => {
              setCode(`package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`);
              setCurrentExample(null);
              setNotesContent(`# Code Documentation

## Description
This is a simple Go program that prints "Hello, World!" to the console.

## How it works
1. The \`main\` package defines the program's entry point
2. The \`main()\` function is executed automatically
3. \`fmt.Println()\` prints the text to the console

## Notes
- Use this space to document your code
- Supports full **Markdown** with GFM syntax
- Annotations will be saved per file`);
              if (editorRef.current) {
                editorRef.current.setValue(`package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`);
              }
            }}
            className="p-2 m-2 text-dracula-fg hover:text-dracula-green hover:bg-dracula-current rounded transition-all flex-shrink-0"
            title="New Go Playground"
          >
            <FileCode className="w-5 h-5" />
          </button>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 m-2 text-dracula-fg hover:text-dracula-purple hover:bg-dracula-current rounded transition-all flex-shrink-0 ${sidebarOpen ? "text-dracula-purple bg-dracula-current" : ""
              }`}
            title="Toggle Examples"
          >
            <BookType className="w-5 h-5" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings Buttons - Positioned at absolute bottom */}
          <div className="absolute bottom-2 flex flex-col gap-1">
            <button
              onClick={() => setGoSettingsOpen(true)}
              className="p-2 text-dracula-comment hover:text-dracula-fg hover:bg-dracula-current rounded transition-all"
              title="Go Settings"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-dracula-comment hover:text-dracula-fg hover:bg-dracula-current rounded transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`bg-dracula-bg border-r border-dracula-comment transition-all duration-300 flex flex-col h-full ${sidebarOpen ? "w-80" : "w-0"
            } ${sidebarOpen ? "min-w-80" : "min-w-0"} overflow-hidden`}
        >
          {/* Sidebar Header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-dracula-comment">
            <div className="flex items-center gap-2 mb-4">
              <BookType className="w-5 h-5 text-dracula-purple" />
              <h2 className="text-lg font-semibold text-dracula-purple">
                Go Examples
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dracula-comment" />
              <input
                type="text"
                placeholder="Search examples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dracula-bg text-dracula-fg border border-dracula-comment rounded focus:border-dracula-purple outline-none text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-dracula-bg text-dracula-fg border border-dracula-comment rounded focus:border-dracula-purple outline-none text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Examples List - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            <div className="space-y-2 min-h-full">
              {Object.entries(examplesByCategory).map(
                ([category, examples]) => (
                  <div key={category} className="mb-2">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center gap-2 text-left p-2 hover:bg-dracula-current rounded transition-colors"
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="w-4 h-4 text-dracula-comment flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-dracula-comment flex-shrink-0" />
                      )}
                      <span className="font-medium text-dracula-cyan flex-1 min-w-0">
                        {category}
                      </span>
                      <span className="text-xs text-dracula-comment flex-shrink-0">
                        ({examples.length})
                      </span>
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="ml-6 space-y-1 mt-1">
                        {examples.map((example) => (
                          <button
                            key={example.id}
                            onClick={() => loadExample(example)}
                            className={`w-full text-left p-2.5 rounded text-sm transition-colors border ${currentExample?.id === example.id
                                ? "bg-dracula-purple bg-opacity-20 text-dracula-purple border-dracula-purple border-opacity-50"
                                : "hover:bg-dracula-current text-dracula-fg border-transparent hover:border-dracula-comment"
                              }`}
                          >
                            <div className="font-medium mb-1">
                              {example.title}
                            </div>
                            <div className="text-xs text-dracula-comment leading-relaxed">
                              {example.description}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {example.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-1.5 py-0.5 text-xs bg-dracula-bg text-dracula-comment rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}

              {/* Empty state */}
              {Object.keys(examplesByCategory).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-dracula-comment mb-2">📝</div>
                  <div className="text-sm text-dracula-comment">
                    No examples found
                  </div>
                  <div className="text-xs text-dracula-comment mt-1">
                    Try a different search
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer - Fixed */}
          <div className="flex-shrink-0 p-4 border-t border-dracula-comment">
            <div className="text-xs text-dracula-comment text-center">
              {Object.values(examplesByCategory).flat().length} example(s)
              available
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div
          ref={editorPanelRef}
          className="flex-1 flex flex-col relative"
        >
          {/* Notes/Documentation Block with Chat Split */}
          <div
            className={
              "bg-dracula-bg border-b border-dracula-comment flex flex-col " +
              (notesOpen ? "flex-1 min-h-0" : "flex-shrink-0")
            }
          >
            {/* Notes Header */}
            <div className="px-4 py-1.5 text-sm text-dracula-comment border-b border-dracula-comment flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!notesOpen) {
                      // Se abrindo anotações, fechar editor
                      setNotesOpen(true);
                      setCodeEditorOpen(false);
                    } else {
                      // Se fechando anotações, abrir editor
                      setNotesOpen(false);
                      setCodeEditorOpen(true);
                    }
                  }}
                  className="flex items-center gap-1 hover:text-dracula-purple transition-colors"
                >
                  {notesOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                  <StickyNote className="w-4 h-4" />
                  <span>Notes</span>
                </button>
              </div>
              {notesOpen && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNotesMode("preview")}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${notesMode === "preview"
                        ? "bg-dracula-purple text-dracula-bg"
                        : "hover:text-dracula-purple"
                      }`}
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => setNotesMode("edit")}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${notesMode === "edit"
                        ? "bg-dracula-purple text-dracula-bg"
                        : "hover:text-dracula-purple"
                      }`}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Notes Content with Chat Split */}
            {notesOpen && (
              <div className="flex flex-1 min-h-0 p-0">
                {/* Left Side - Documentation */}
                <div className="flex-1 flex flex-col min-w-0 p-2">
                  {/* Documentation Header */}
                  <div className="px-3 py-2 text-xs text-dracula-comment border-b border-dracula-comment bg-dracula-current bg-opacity-10 flex items-center gap-2">
                    <StickyNote className="w-3 h-3" />
                    <span>Documentation</span>
                  </div>

                  {/* Documentation Content */}
                  {notesMode === "edit" ? (
                    <Editor
                      height="100%"
                      defaultLanguage="markdown"
                      value={notesContent}
                      onChange={(value) => setNotesContent(value || "")}
                      onMount={(editor) => {
                        notesEditorRef.current = editor;
                      }}
                      theme="dracula"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "off",
                        glyphMargin: false,
                        folding: false,
                        lineDecorationsWidth: 0,
                        lineNumbersMinChars: 0,
                        renderLineHighlight: "none",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        padding: { top: 12, bottom: 12 },
                      }}
                    />
                  ) : (
                    <div
                      className="flex-1 overflow-y-auto p-4 markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          marked(notesContent) as string,
                        ),
                      }}
                    />
                  )}
                </div>

                {/* Vertical Divider - Resizable */}
                <div 
                  className={`w-1 bg-dracula-comment hover:bg-dracula-purple cursor-col-resize transition-colors relative ${
                    isDraggingChat ? "bg-dracula-purple" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingChat(true);
                  }}
                >
                  <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
                </div>

                {/* Right Side - Chat */}
                <div style={{ width: `${chatWidth}px` }} className="flex flex-col bg-dracula-bg">
                  {/* Chat Header */}
                  <div className="px-3 py-2 text-xs text-dracula-comment border-b border-dracula-comment bg-dracula-current bg-opacity-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" />
                      <span>AI Chat</span>
                    </div>
                    <div>
                      {openaiToken ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-dracula-green bg-opacity-20 text-dracula-green rounded text-xs">
                          <div className="w-1.5 h-1.5 bg-dracula-green rounded-full" />
                          Connected
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-dracula-orange bg-opacity-20 text-dracula-orange rounded text-xs cursor-pointer"
                          onClick={() => setSettingsOpen(true)}
                        >
                          <div className="w-1.5 h-1.5 bg-dracula-orange rounded-full" />
                          Configure
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div
                    ref={chatMessagesRef}
                    className="flex-1 overflow-y-auto min-h-0"
                  >
                    {chatMessages.length === 0 && !isAiThinking ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <div className="text-4xl mb-3">🤖</div>
                        <div className="text-sm text-dracula-comment mb-2">
                          AI Chat
                        </div>
                        <div className="text-xs text-dracula-comment max-w-sm">
                          Ask questions about your Go code. The AI has access to
                          the current code, documentation and execution results.
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {chatMessages.map((message) => (
                          <div key={message.id} className={`flex gap-3 ${message.type === "ai" ? "chat-message-ai" : "chat-message-user"}`}>
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-dracula-current flex items-center justify-center text-xs">
                              {message.type === "ai" ? "🤖" : "👤"}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-dracula-comment mb-1">
                                {message.type === "ai" ? "AI" : "You"} •{" "}
                                {message.timestamp.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-dracula-fg bg-dracula-current bg-opacity-30 rounded-lg p-2">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                      marked(message.content) as string,
                                    ),
                                  }}
                                  className="markdown-content"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* AI Thinking Indicator */}
                        {isAiThinking && (
                          <div className="flex gap-3 ai-thinking-indicator">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-dracula-current flex items-center justify-center text-xs">
                              🤖
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-dracula-comment mb-1">
                                AI • thinking...
                              </div>
                              <div className="text-sm text-dracula-fg bg-dracula-current bg-opacity-30 rounded-lg p-2 flex items-center gap-2">
                                <div className="flex space-x-1">
                                  <div
                                    className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  ></div>
                                </div>
                                <span className="text-dracula-comment text-xs">
                                  Analyzing your code...
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex-shrink-0 border-t border-dracula-comment bg-dracula-current bg-opacity-10 p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        placeholder="Ask about the code..."
                        className="flex-1 bg-dracula-bg border border-dracula-comment rounded px-3 py-2 text-sm text-dracula-fg placeholder-dracula-comment focus:outline-none focus:border-dracula-purple transition-colors"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim()}
                        className="px-3 py-2 bg-dracula-purple text-dracula-bg rounded text-sm font-medium hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Code Editor Section with Chat */}
          <div
            className={
              (codeEditorOpen ? "flex-1" : "flex-shrink-0") +
              " flex flex-col relative overflow-hidden transition-all duration-300"
            }
          >
            {codeEditorOpen && (
              <div className="flex flex-1 min-h-0">
                {/* Code Editor Side */}
                <div className="flex-1 flex flex-col min-w-0">
            {/* Code Editor Header */}
            <div className="bg-dracula-bg px-4 py-1.5 text-sm text-dracula-comment border-b border-dracula-comment flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!codeEditorOpen) {
                      // Se abrindo editor, fechar anotações
                      setCodeEditorOpen(true);
                      setNotesOpen(false);
                    } else {
                      // Se fechando editor, abrir anotações
                      setCodeEditorOpen(false);
                      setNotesOpen(true);
                    }
                  }}
                  className="p-1 hover:bg-dracula-current rounded transition-colors"
                  title={codeEditorOpen ? "Close code" : "Open code"}
                >
                  {codeEditorOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <FileCode2 className="w-4 h-4" />
                <span>{currentExample ? currentExample.title : "main.go"}</span>
                {currentExample && (
                  <span className="text-xs px-2 py-0.5 bg-dracula-purple bg-opacity-20 text-dracula-purple rounded">
                    {currentExample.category}
                  </span>
                )}
              </div>
              <span className="text-xs opacity-60">Go 1.23</span>
            </div>

                {/* Floating Format Button */}
                <button
                  onClick={handleFormat}
                  disabled={isFormatting}
                  className="absolute top-12 right-4 z-10 p-2 bg-dracula-bg hover:bg-dracula-current text-dracula-fg rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-dracula-comment hover:border-dracula-purple"
                  title="Format code (⌘+F)"
                >
                  {isFormatting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlignLeft className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="go"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    onMount={handleEditorDidMount}
                    theme="dracula"
                    beforeMount={(monaco) => {
                      // Define the Dracula theme
                      monaco.editor.defineTheme("dracula", draculaTheme);

                      // Setup Go IntelliSense
                      setupGoIntellisense(monaco);

                      // Make monaco globally available for keyboard shortcuts
                      (window as any).monaco = monaco;
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily:
                        'JetBrains Mono, Monaco, "Courier New", monospace',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      scrollbar: {
                        vertical: "hidden",
                        horizontal: "hidden",
                        verticalScrollbarSize: 0,
                        horizontalScrollbarSize: 0,
                      },
                      renderWhitespace: "selection",
                      tabSize: 4,
                      insertSpaces: false,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      smoothScrolling: true,
                      padding: { top: 16, bottom: 16 },
                      lineNumbers: "on",
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 0,
                      lineNumbersMinChars: 4,
                      renderLineHighlight: "all",
                      // IntelliSense settings
                      quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                      },
                      parameterHints: {
                        enabled: true,
                      },
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: "on",
                      tabCompletion: "on",
                      wordBasedSuggestions: "currentDocument",
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                        showClasses: true,
                        showFunctions: true,
                        showVariables: true,
                        showConstants: true,
                        showModules: true,
                        showProperties: true,
                        showMethods: true,
                        snippetsPreventQuickSuggestions: false,
                        insertMode: "replace",
                      },
                      // Enable auto closing brackets
                      autoClosingBrackets: "always",
                      autoClosingQuotes: "always",
                      // Format on type
                      formatOnType: true,
                      formatOnPaste: true,
                    }}
                  />
                </div>
                </div>

                {/* Vertical Divider - Resizable */}
                <div 
                  className={`w-1 bg-dracula-comment hover:bg-dracula-purple cursor-col-resize transition-colors relative ${
                    isDraggingChat ? "bg-dracula-purple" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDraggingChat(true);
                  }}
                >
                  <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
                </div>

                {/* Right Side - Chat (same for code editor) */}
                <div style={{ width: `${chatWidth}px` }} className="flex flex-col bg-dracula-bg">
                  {/* Chat Header */}
                  <div className="px-3 py-2 text-xs text-dracula-comment border-b border-dracula-comment bg-dracula-current bg-opacity-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3 h-3" />
                      <span>AI Chat</span>
                    </div>
                    <div>
                      {openaiToken ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-dracula-green bg-opacity-20 text-dracula-green rounded text-xs">
                          <div className="w-1.5 h-1.5 bg-dracula-green rounded-full" />
                          Connected
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-dracula-orange bg-opacity-20 text-dracula-orange rounded text-xs cursor-pointer"
                          onClick={() => setSettingsOpen(true)}
                        >
                          <div className="w-1.5 h-1.5 bg-dracula-orange rounded-full" />
                          Configure
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div
                    ref={chatMessagesRef}
                    className="flex-1 overflow-y-auto min-h-0"
                  >
                    {chatMessages.length === 0 && !isAiThinking ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <div className="text-4xl mb-3">🤖</div>
                        <div className="text-sm text-dracula-comment mb-2">
                          AI Chat
                        </div>
                        <div className="text-xs text-dracula-comment max-w-sm">
                          Ask questions about your Go code. The AI has access to
                          the current code, documentation and execution results.
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {chatMessages.map((message) => (
                          <div key={message.id} className={`flex gap-3 ${message.type === "ai" ? "chat-message-ai" : "chat-message-user"}`}>
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-dracula-current flex items-center justify-center text-xs">
                              {message.type === "ai" ? "🤖" : "👤"}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-dracula-comment mb-1">
                                {message.type === "ai" ? "AI" : "You"} •{" "}
                                {message.timestamp.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-sm text-dracula-fg bg-dracula-current bg-opacity-30 rounded-lg p-2">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                      marked(message.content) as string,
                                    ),
                                  }}
                                  className="markdown-content"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* AI Thinking Indicator */}
                        {isAiThinking && (
                          <div className="flex gap-3 ai-thinking-indicator">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-dracula-current flex items-center justify-center text-xs">
                              🤖
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-dracula-comment mb-1">
                                AI • thinking...
                              </div>
                              <div className="text-sm text-dracula-fg bg-dracula-current bg-opacity-30 rounded-lg p-2 flex items-center gap-2">
                                <div className="flex space-x-1">
                                  <div
                                    className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-dracula-purple rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  ></div>
                                </div>
                                <span className="text-dracula-comment text-xs">
                                  Analyzing your code...
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex-shrink-0 border-t border-dracula-comment bg-dracula-current bg-opacity-10 p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        placeholder="Ask about the code..."
                        className="flex-1 bg-dracula-bg border border-dracula-comment rounded px-3 py-2 text-sm text-dracula-fg placeholder-dracula-comment focus:outline-none focus:border-dracula-purple transition-colors"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim()}
                        className="px-3 py-2 bg-dracula-purple text-dracula-bg rounded text-sm font-medium hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Console Resize Handle */}
      <div 
        className={`h-1 bg-dracula-comment hover:bg-dracula-purple cursor-row-resize transition-colors relative ${
          isDraggingConsole ? "bg-dracula-purple" : ""
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDraggingConsole(true);
        }}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1 z-10" />
      </div>

      {/* Console Panel - Resizable */}
      <div style={{ height: `${consoleHeight}px` }} className="bg-dracula-bg border-t border-dracula-comment flex flex-col">
        <div className="bg-dracula-bg px-4 py-1.5 text-sm text-dracula-comment border-b border-dracula-comment flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>Output</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
          </div>
        </div>
        <div className="flex-1 p-4 bg-dracula-bg overflow-auto min-h-0">
          <pre
            className={`font-mono text-xs whitespace-pre-wrap ${output.includes("Error") || output.includes("error:")
                ? "text-dracula-red"
                : output.includes("===")
                  ? "text-dracula-cyan"
                  : "text-dracula-green"
              }`}
          >
            {output || (
              <span className="text-dracula-comment italic">
                Click "Run" to execute your code...
              </span>
            )}
          </pre>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dracula-bg border border-dracula-comment rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dracula-comment">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-dracula-purple" />
                <h2 className="text-lg font-semibold text-dracula-fg">
                  Settings
                </h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 text-dracula-comment hover:text-dracula-fg hover:bg-dracula-current rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-1 min-h-0">
              {/* Settings Tabs */}
              <div className="w-48 border-r border-dracula-comment bg-dracula-current bg-opacity-20">
                <div className="p-2">
                  <button
                    onClick={() => setActiveSettingsTab("openai")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeSettingsTab === "openai"
                        ? "bg-dracula-purple bg-opacity-20 text-dracula-purple border border-dracula-purple border-opacity-50"
                        : "hover:bg-dracula-current text-dracula-fg"
                      }`}
                  >
                    {/* OpenAI Logo */}
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4954zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-sm">OpenAI</div>
                      <div className="text-xs text-dracula-comment">
                        API Token
                      </div>
                    </div>
                  </button>

                  {/* Workspace Tab */}
                  <button
                    onClick={() => setActiveSettingsTab("workspace")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mt-2 ${activeSettingsTab === "workspace"
                        ? "bg-dracula-purple bg-opacity-20 text-dracula-purple border border-dracula-purple border-opacity-50"
                        : "hover:bg-dracula-current text-dracula-fg"
                      }`}
                  >
                    <FolderOpen className="w-5 h-5" />
                    <div>
                      <div className="font-medium text-sm">Workspace</div>
                      <div className="text-xs text-dracula-comment">
                        Custom Examples
                      </div>
                    </div>
                  </button>

                  {/* Future settings tabs can be added here */}
                  <div className="mt-2 p-2 text-xs text-dracula-comment text-center border border-dashed border-dracula-comment rounded">
                    More settings coming soon...
                  </div>
                </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1 p-6">
                {activeSettingsTab === "openai" && (
                  <div className="space-y-6">
                    {/* OpenAI Settings */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-6 h-6 fill-current text-dracula-purple"
                        >
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4954zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                        </svg>
                        <div>
                          <h3 className="text-lg font-semibold text-dracula-fg">
                            OpenAI API
                          </h3>
                          <p className="text-sm text-dracula-comment">
                            Configure your token to enable AI chat
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* API Token Input */}
                        <div>
                          <label className="block text-sm font-medium text-dracula-fg mb-2">
                            <Key className="w-4 h-4 inline mr-2" />
                            API Token
                          </label>
                          <input
                            type="password"
                            value={openaiToken}
                            onChange={(e) => setOpenaiToken(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 bg-dracula-bg border border-dracula-comment rounded-lg text-dracula-fg placeholder-dracula-comment focus:border-dracula-purple focus:outline-none transition-colors"
                          />
                          <p className="mt-2 text-xs text-dracula-comment">
                            Your token is stored locally and never
                            shared. Get your token at{" "}
                            <a
                              href="https://platform.openai.com/api-keys"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-dracula-purple hover:underline"
                            >
                              platform.openai.com
                            </a>
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 p-3 bg-dracula-current bg-opacity-20 rounded-lg">
                          <div
                            className={`w-2 h-2 rounded-full ${openaiToken ? "bg-dracula-green" : "bg-dracula-orange"}`}
                          />
                          <span className="text-sm text-dracula-fg">
                            {openaiToken
                              ? "Token configured"
                              : "Token not configured"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-dracula-comment">
                      <button
                        onClick={() => {
                          // Save token to localStorage
                          if (openaiToken.trim()) {
                            localStorage.setItem(
                              "openai_token",
                              openaiToken.trim(),
                            );
                          } else {
                            localStorage.removeItem("openai_token");
                          }
                          console.log("OpenAI token saved to localStorage");
                          setSettingsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-dracula-purple text-dracula-bg rounded-lg hover:bg-opacity-80 transition-colors font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Workspace Settings */}
                {activeSettingsTab === "workspace" && (
                  <div className="space-y-6">
                    {/* Workspace Settings */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <FolderOpen className="w-6 h-6 text-dracula-purple" />
                        <div>
                          <h3 className="text-lg font-semibold text-dracula-fg">
                            Custom Workspace
                          </h3>
                          <p className="text-sm text-dracula-comment">
                            Configure a folder for your custom examples
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Use Custom Workspace Toggle */}
                        <div className="flex items-center justify-between p-3 bg-dracula-current bg-opacity-20 rounded-lg">
                          <div>
                            <div className="font-medium text-sm text-dracula-fg">
                              Use Custom Workspace
                            </div>
                            <div className="text-xs text-dracula-comment mt-1">
                              Enable to load examples from a custom
                              folder
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newValue = !isCustomWorkspace;
                              setIsCustomWorkspace(newValue);
                              localStorage.setItem(
                                "use_custom_workspace",
                                newValue.toString(),
                              );
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCustomWorkspace
                                ? "bg-dracula-purple"
                                : "bg-dracula-comment"
                              }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCustomWorkspace
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                }`}
                            />
                          </button>
                        </div>

                        {/* Workspace Path */}
                        {isCustomWorkspace && (
                          <div>
                            <label className="block text-sm font-medium text-dracula-fg mb-2">
                              <FolderOpen className="w-4 h-4 inline mr-2" />
                              Workspace Folder
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={workspacePath}
                                onChange={(e) =>
                                  setWorkspacePath(e.target.value)
                                }
                                placeholder="Select a folder..."
                                className="flex-1 px-3 py-2 bg-dracula-bg border border-dracula-comment rounded-lg text-dracula-fg placeholder-dracula-comment focus:border-dracula-purple focus:outline-none transition-colors"
                                readOnly
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    const result =
                                      await SelectWorkspaceFolder();
                                    if (result) {
                                      setWorkspacePath(result);
                                      localStorage.setItem(
                                        "workspace_path",
                                        result,
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error selecting folder:",
                                      error,
                                    );
                                  }
                                }}
                                className="px-3 py-2 bg-dracula-purple text-dracula-bg rounded-lg hover:bg-opacity-80 transition-colors font-medium flex items-center gap-2"
                              >
                                <FolderOpen className="w-4 h-4" />
                                Select
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-dracula-comment">
                              Choose a folder where your custom examples
                              will be saved and loaded
                            </p>
                          </div>
                        )}

                        {/* Workspace Actions */}
                        {isCustomWorkspace && workspacePath && (
                          <div className="space-y-3">
                            <div className="border-t border-dracula-comment pt-4">
                              <h4 className="font-medium text-dracula-fg mb-3">
                                Workspace Actions
                              </h4>
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={async () => {
                                    try {
                                      await CreateWorkspaceTemplate(
                                        workspacePath,
                                      );
                                      console.log(
                                        "Template created successfully",
                                      );
                                      // Reload examples
                                      const customExamples =
                                        await LoadExamplesFromFolder(
                                          workspacePath,
                                        );
                                      setExamples(customExamples);
                                    } catch (error) {
                                      console.error(
                                        "Error creating template:",
                                        error,
                                      );
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-dracula-green text-dracula-bg rounded-lg hover:bg-opacity-80 transition-colors font-medium text-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  Create Template
                                </button>

                                <button
                                  onClick={async () => {
                                    try {
                                      const customExamples =
                                        await LoadExamplesFromFolder(
                                          workspacePath,
                                        );
                                      setExamples(customExamples);
                                      console.log(
                                        `Loaded ${customExamples.length} custom examples`,
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Error loading examples:",
                                        error,
                                      );
                                    }
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-dracula-cyan text-dracula-bg rounded-lg hover:bg-opacity-80 transition-colors font-medium text-sm"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                  Load Examples
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-2 p-3 bg-dracula-current bg-opacity-20 rounded-lg">
                          <div
                            className={`w-2 h-2 rounded-full ${isCustomWorkspace && workspacePath
                                ? "bg-dracula-green"
                                : "bg-dracula-orange"
                              }`}
                          />
                          <span className="text-sm text-dracula-fg">
                            {isCustomWorkspace
                              ? workspacePath
                                ? `Workspace: ${workspacePath.split("/").pop()}`
                                : "Workspace not configured"
                              : "Using default examples"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-dracula-comment">
                      <button
                        onClick={() => {
                          // Save workspace settings
                          localStorage.setItem("workspace_path", workspacePath);
                          localStorage.setItem(
                            "use_custom_workspace",
                            isCustomWorkspace.toString(),
                          );
                          console.log("Workspace settings saved");
                          setSettingsOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-dracula-purple text-dracula-bg rounded-lg hover:bg-opacity-80 transition-colors font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar - Fixed at bottom */}
      <div className="bg-dracula-bg px-4 py-1 text-xs text-dracula-comment border-t border-dracula-comment flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${isRunning
                  ? "bg-dracula-orange animate-pulse"
                  : isFormatting
                    ? "bg-dracula-yellow animate-pulse"
                    : "bg-dracula-green"
                }`}
            />
            {isRunning ? "Compiling" : isFormatting ? "Formatting" : "Ready"}
          </span>
          <span>Go 1.23</span>
          <span className="text-dracula-purple">IntelliSense Active</span>
          {currentExample && (
            <span className="text-dracula-cyan">📚 {currentExample.title}</span>
          )}
        </div>
        <span className="text-dracula-purple font-semibold">
          Developed with ❤️ by <span className="text-yellow-300">devMoisa</span>
        </span>
      </div>

      {/* Go Settings Modal */}
      <GoSettings 
        isOpen={goSettingsOpen} 
        onClose={() => setGoSettingsOpen(false)} 
      />
    </div>
  );
}

export default App;
