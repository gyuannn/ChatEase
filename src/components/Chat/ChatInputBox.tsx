import { Textarea, ActionIcon } from "@mantine/core";
import {
  IconX,
  IconArrowBackUp,
  IconMessageCircle,
  IconSend,
} from "@tabler/icons-react";
import {
  forwardRef,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { requestApi, requestPromptApi } from "../../services/openAI/apiConfig";
import { dateToTimestamp } from "../../services/utils/DateTimestamp";
import { Message } from "../../database/models/Message";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  setMessageTokens,
  setNewUserMessage,
  setTokensBoxWarningStateTo,
  updateChatsAfterCreated,
} from "../../reducers/chatSlice";
import { setActionId, setPromptIsResponsing } from "../../reducers/promptSlice";
import { ChatActionBar } from "./ChatActionBar";
import { Prompt } from "../../database/models/Prompt";
import { useFocusWithin, useMergedRef } from "@mantine/hooks";

function getFirstSentence(text: string) {
  let firstSentence = "";
  if (text) {
    const sentences = text.match(/^.+[\n,，.。?？]/g);
    if (sentences) {
      firstSentence = sentences[0].trim().slice(0, sentences[0].length - 1);
    } else {
      return text;
    }
  }
  return firstSentence;
}

interface ChatInputBoxProps {
  chatId: number;
  messages: Message[];
}

let isComposing = false;
let historyMessage = "";

export const ChatInputBox = forwardRef(
  (
    { messages, chatId }: ChatInputBoxProps,
    ref: MutableRefObject<HTMLTextAreaElement>
  ) => {
    const dispatch = useAppDispatch();

    const isPromptResponsing = useAppSelector(
      (state) => state.prompt.isPromptResponsing
    );

    const isResponsing = useAppSelector((state) => state.chat.isResponsing);
    const promptTokens = useAppSelector(
      (state) => state.chat.totalPromptTokens
    );
    const runningActionId = useAppSelector((state) => state.prompt.actionId);
    const answerContent = useAppSelector((state) => state.prompt.answerContent);

    const [message, setMessage] = useState<string>();
    const [actionsBarVisible, setActionsBarVisible] = useState<boolean>(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      if (!isComposing && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        target.form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      setActionsBarVisible(false);

      // 已发送信息和空字串不处理
      if (!message || message.trim() === "" || isResponsing) {
        return;
      }

      // 检查是否符合tokens限制
      if (
        promptTokens > window.electronAPI.storeIpcRenderer.get("max_tokens")
      ) {
        dispatch(setTokensBoxWarningStateTo("tokens_limit"));
        return;
      }

      // 判断是否为新会话
      let _chatId: number = chatId;
      if (_chatId === -1) {
        _chatId = await window.electronAPI.databaseIpcRenderer.createChat({
          name: getFirstSentence(message),
          timestamp: dateToTimestamp(new Date()),
        });
        // 创建会话
        dispatch(updateChatsAfterCreated(_chatId));
      }

      // create a new message
      const newMessage: Message = {
        text: message.trim(),
        sender: "user",
        timestamp: dateToTimestamp(new Date()),
        chatId: _chatId,
        inPrompts: true,
      };

      window.electronAPI.databaseIpcRenderer
        .createMessage(newMessage)
        .then((message) => {
          dispatch(setNewUserMessage(message));
          setMessage("");
        });

      // setLoading(true);

      // Send prompt messages
      const sendMessages: Message[] = [...messages, newMessage].filter(
        (msg) => msg.inPrompts
      );

      requestApi(_chatId, sendMessages);
    };

    const textAreaInputWaitingActionResponseState = useMemo(
      () => isPromptResponsing && runningActionId === "chat-action",
      [isPromptResponsing, runningActionId]
    );

    const handlePromptAction = (prompt: Prompt) => {
      dispatch(setActionId("chat-action"));
      historyMessage = message;
      requestPromptApi(prompt, message);
    };

    const { ref: inputBoxRef, focused } = useFocusWithin();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const _textAreaRef = useMergedRef(textAreaRef, ref);

    useEffect(() => {
      setActionsBarVisible(focused);
    }, [focused]);

    useEffect(() => {
      if (runningActionId === "chat-action") {
        setMessage(answerContent);
        if (!isPromptResponsing) {
          dispatch(setActionId(""));
          textAreaRef.current.focus();
        }
      }
    }, [answerContent, isPromptResponsing]);

    return (
      <div ref={inputBoxRef}>
        <ChatActionBar
          visible={actionsBarVisible}
          onClick={(prompt) => handlePromptAction(prompt)}
        />
        <div className="bg-gray-100 p-4 flex items-center border-solid border-0 border-t border-gray-200">
          <IconMessageCircle size={20} className="mr-2" />
          <form
            className="flex items-center justify-between flex-1"
            onSubmit={handleSendMessage}
          >
            <Textarea
              ref={_textAreaRef}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                dispatch(setMessageTokens(event.target.value.trim()));
              }}
              disabled={textAreaInputWaitingActionResponseState}
              onFocus={() => setActionsBarVisible(true)}
              onCompositionStart={() => {
                isComposing = true;
              }}
              onCompositionEnd={() => {
                isComposing = false;
              }}
              onKeyDown={(event) => {
                handleKeyDown(event);
              }}
              placeholder={
                textAreaInputWaitingActionResponseState
                  ? "Waiting..."
                  : "Type your message here..."
              }
              className="flex-1 mr-2"
              autosize
              minRows={1}
              maxRows={5}
              rightSection={
                isPromptResponsing ? (
                  <div className="flex items-end">
                    <ActionIcon
                      color="red"
                      size="sm"
                      onClick={() => dispatch(setPromptIsResponsing(false))}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <ActionIcon
                      color="blue"
                      size="sm"
                      onClick={() => setMessage(historyMessage)}
                    >
                      <IconArrowBackUp size={12} />
                    </ActionIcon>
                  </div>
                )
              }
            ></Textarea>
            <ActionIcon color="blue" type="submit" variant="subtle" size="sm">
              <IconSend size={16} />
            </ActionIcon>
          </form>
        </div>
      </div>
    );
  }
);