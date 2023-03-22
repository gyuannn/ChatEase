import { Button, rem } from "@mantine/core";
import { IconClipboardCopy, IconCheck } from "@tabler/icons-react";
import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import { CodeProps } from "react-markdown/lib/ast-to-react";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark-reasonable.css";
import { handleNotis } from "../services/utils/notis";

const CodeToolbar = ({ type, code }: { type: string; code: string }) => {
  const [state, setState] = React.useState(false);

  const onCopyEvent = () => {
    navigator.clipboard.writeText(code);
    setState(true);
    setTimeout(() => {
      setState(false);
    }, 1500);
  };

  return (
    <div
      className="flex justify-between items-center h-6 bg-gray-800 text-white px-2"
      style={{
        borderTopRightRadius: "0.5rem",
        borderTopLeftRadius: "0.5rem",
      }}
    >
      <div>{type}</div>
      <Button
        onClick={() => onCopyEvent()}
        leftIcon={
          !state ? <IconClipboardCopy size={16} /> : <IconCheck size={16} />
        }
        size="sm"
        variant="subtle"
        className="h-5 text-xs"
        color="gray"
        styles={(theme) => ({
          root: {
            backgroundColor: "#1F2937",
            border: 0,
            color: "white",
            height: rem(20),
            paddingLeft: rem(5),
            paddingRight: rem(5),
            "&:not([data-disabled])": theme.fn.hover({
              backgroundColor: theme.fn.darken("#1F2937", 0.05),
            }),
          },

          leftIcon: {
            marginRight: theme.spacing.sm,
          },
        })}
      >
        {state ? "Copied !" : "Copy code"}
      </Button>
    </div>
  );
};

export const Markdown = memo(
  ({ text, codeScope }: { text: string; codeScope: string[] }) => {
    return (
      <ReactMarkdown
        children={text}
        components={{
          code({
            node,
            inline,
            className,
            children,
            style,
            ...props
          }: CodeProps) {
            //   const match = /language-(\w+)/.exec(className || "");
            try {
              hljs.configure({
                languages: codeScope,
              });
            } catch (e) {
              handleNotis({
                title: "Settings Error",
                type: "error",
                message: `Incorrectly configuring "Scope of languages in Markdown" in general settings.`,
              });
            }
            const highlightedCode = hljs.highlightAuto(children.join(""));
            return !inline ? (
              <div>
                <CodeToolbar
                  type={highlightedCode.language}
                  code={
                    children && children.length > 0 ? children.join("") : ""
                  }
                />
                <div
                  className="overflow-scroll py-3 px-2 text-white"
                  style={{
                    background: "#282C34",
                    borderBottomRightRadius: "0.5rem",
                    borderBottomLeftRadius: "0.5rem",
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: highlightedCode.value,
                    }}
                  />
                </div>
                {/* <SyntaxHighlighter
                style={nightOwl}
                customStyle={{
                  marginTop: 0,
                  borderBottomRightRadius: "0.5rem",
                  borderBottomLeftRadius: "0.5rem",
                }}
                children={String(children).replace(/\n$/, "")}
                showLineNumbers={true}
                PreTag="div"
                {...props}
              /> */}
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      />
    );
  }
);
