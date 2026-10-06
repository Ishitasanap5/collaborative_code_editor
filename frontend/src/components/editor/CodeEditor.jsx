import Editor from "@monaco-editor/react";

function CodeEditor({
    defaultValue = "",
    language,
    onChange,
    onMount,
    readOnly = false
}) {
    return (
        <Editor
            height="100%"
            width="100%"
            theme="vs-dark"
            language={language}
            defaultValue={defaultValue}
            onMount={onMount}
            onChange={onChange}
            options={{
                readOnly: readOnly,
                domReadOnly: readOnly,
                automaticLayout: true,
                minimap: {
                    enabled: false
                },
                fontSize: 14,
                tabSize: 4,
                wordWrap: "on"
            }}
        />
    );
}

export default CodeEditor;