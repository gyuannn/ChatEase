import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  recalMessages,
  setSelectedChat,
  setTokensBoxWarningStateToFalse,
} from "../../reducers/chatSlice";
import {
  ActionIcon,
  clsx,
  NumberInput,
  Select,
  Slider,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { storeRendererUtils } from "../../store/storeRendererUtils";
import { openAIModels } from "../../services/openAI/data";
import { IconX } from "@tabler/icons-react";

interface ChatStatisticsProps {
  messagesInPromptsNum: number;
}

export const ChatStatistics = ({
  messagesInPromptsNum,
}: ChatStatisticsProps) => {
  const dispatch = useAppDispatch();
  const warningState = useAppSelector(
    (state) => state.chat.tokensBoxWarningState
  );
  const chatId = useAppSelector((state) => state.chat.selectedChatId);
  const [opened, { close, open }] = useDisclosure();

  useEffect(() => {
    if (warningState) {
      setTimeout(() => {
        dispatch(setTokensBoxWarningStateToFalse());
      }, 2500);
    }
  }, [warningState]);

  const openChatSetting = () => {
    if (!warningState && !opened) {
      open();
    }
  };

  return (
    <div
      className={clsx(
        "sticky bg-transparent flex justify-center bottom-0 z-50 transition-all",
        chatId === -1 && "max-h-0 overflow-hidden"
      )}
    >
      <div
        className={clsx(
          "bg-white text-gray-900 px-3 py-1 shadow overflow-hidden",
          warningState && "outline outline-2 outline-red-500",
          opened
            ? "rounded-lg"
            : "rounded-full hover:bg-violet-50 hover:cursor-pointer"
        )}
        style={{
          display: "inline-block",
          height: opened ? "258px" : warningState ? "42.59px" : "26.59px",
          transition: "height 0.15s ease-in-out",
        }}
        onClick={openChatSetting}
      >
        {opened ? (
          <ChatSettings chatId={chatId} onClose={close} />
        ) : (
          <Statistics
            messagesInPromptNum={messagesInPromptsNum}
            warningState={warningState}
          />
        )}
      </div>
    </div>
  );
};

interface StatisticsProps {
  warningState: "tokens_limit" | "messages_limit" | "";
  messagesInPromptNum: number;
}

const Statistics = ({ warningState, messagesInPromptNum }: StatisticsProps) => {
  const messageTokens = useAppSelector((state) => state.chat.inputBoxTokens);
  const promptTokens = useAppSelector((state) => state.chat.totalPromptTokens);
  const selectedChat = useAppSelector((state) => state.chat.selectedChat);

  const messages_limit =
    (selectedChat && selectedChat.messagesLimit) ??
    window.electronAPI.storeIpcRenderer.get("max_messages_num");
  const tokens_limit =
    (selectedChat && selectedChat.tokensLimit) ??
    window.electronAPI.storeIpcRenderer.get("max_tokens");

  return (
    <>
      {warningState && (
        <div className="text-red-500 font-semibold text-xs flex justify-center items-center">
          Operation failed: Exceeding limit!
        </div>
      )}
      <div className="flex justify-center items-center italic">
        <Text
          size="xs"
          className={
            warningState === "tokens_limit" ? "text-red-500 font-bold" : ""
          }
        >
          {`Tokens in prompt: ${
            promptTokens + messageTokens
          } (max: ${tokens_limit})`}
        </Text>
        <Text
          size="xs"
          className={clsx(
            "ml-2",
            warningState === "messages_limit" && "text-red-500 font-bold"
          )}
        >
          {`Messages in prompt: ${messagesInPromptNum} (max: ${messages_limit})`}
        </Text>
      </div>
    </>
  );
};

interface ChatSettingsProps {
  chatId: number;
  onClose: () => void;
}

const ChatSettings = ({ chatId, onClose }: ChatSettingsProps) => {
  const dispatch = useAppDispatch();

  const [messagesLimit, setMessagesLimit] = useState<number>(0);
  const [tokensLimit, setTokensLimit] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [model, setModel] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    window.electronAPI.databaseIpcRenderer.getChatById(chatId).then((chat) => {
      setMessagesLimit(
        chat.messagesLimit ?? storeRendererUtils.get<number>("max_messages_num")
      );
      setTokensLimit(
        chat.tokensLimit ?? storeRendererUtils.get<number>("max_tokens")
      );
      setTemperature(chat.temperature ?? 1);
      setModel(chat.model ?? "gpt-3.5-turbo");
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      onClose();
    } else {
      setMounted(true);
    }
  }, [chatId]);

  const onMessagesLimitChange = (value: number) => {
    setMessagesLimit(value);
    window.electronAPI.databaseIpcRenderer
      .updateChatFieldById(chatId, "messagesLimit", value)
      .then((chat) => {
        dispatch(setSelectedChat(chat));
        dispatch(recalMessages());
      });
  };

  const onTokensLimitChange = (value: number) => {
    setTokensLimit(value);
    window.electronAPI.databaseIpcRenderer
      .updateChatFieldById(chatId, "tokensLimit", value)
      .then((chat) => {
        dispatch(setSelectedChat(chat));
        dispatch(recalMessages());
      });
  };

  const onTemperatureChange = (value: number) => {
    setTemperature(value);
    window.electronAPI.databaseIpcRenderer
      .updateChatFieldById(chatId, "temperature", value)
      .then((chat) => {
        dispatch(setSelectedChat(chat));
      });
  };

  const onModelChange = (value: string) => {
    setModel(value);
    window.electronAPI.databaseIpcRenderer
      .updateChatFieldById(chatId, "model", value)
      .then((chat) => {
        setSelectedChat(chat);
      });
  };

  return (
    <div className="p-1" style={{ width: "420px" }}>
      <div className="flex justify-between items-center">
        <div className="font-greycliff font-bold">
          Custom This Chat Settings
        </div>
        <ActionIcon
          size="sm"
          onClick={() => {
            onClose();
          }}
        >
          <IconX size={14} />
        </ActionIcon>
      </div>
      <form>
        <NumberInput
          onChange={onMessagesLimitChange}
          value={messagesLimit}
          variant="filled"
          size="xs"
          label="Limit the number of messages in the prompt context"
        />
        <NumberInput
          onChange={onTokensLimitChange}
          value={tokensLimit}
          variant="filled"
          className="mt-1"
          size="xs"
          label="Limit the number of tokens in the prompt context"
        />
        <div className="mt-2 text-xs font-medium text-gray-800">
          Temperature
        </div>
        <Slider
          onChange={onTemperatureChange}
          value={temperature}
          className="mt-1"
          defaultValue={1}
          min={0}
          size="xs"
          max={2}
          label={(value) => value.toFixed(1)}
          step={0.1}
        ></Slider>
        <Select
          onChange={onModelChange}
          value={model}
          className="mt-1"
          size="xs"
          variant="filled"
          label="Selected Model"
          data={openAIModels.map((model) => ({ label: model, value: model }))}
        ></Select>
      </form>
    </div>
  );
};
