import { ActionIcon, clsx, useMantineTheme } from "@mantine/core";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import { IconPin, IconX } from "@tabler/icons-react";
import { Message } from "@/database/models/Message";
import MessageItem from "./MessageItem";

interface PinnedMessage extends Message {
  index: number;
}

export const PinnedMessages = ({ messages }: { messages: Message[] }) => {
  const { colorScheme } = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const ref = useClickOutside<HTMLDivElement>(() => null);

  const pinnedMessages: PinnedMessage[] = messages.reduce((pms, msg, index) => {
    if (msg.fixedInPrompt) {
      return [...pms, { ...msg, index: index }];
    } else {
      return [...pms];
    }
  }, []);

  return (
    <>
      {pinnedMessages.length !== 0 && (
        <div className="sticky w-full top-1 z-50 bg-transparent mb-2 transition-all ease-in">
          <div className="flex justify-center">
            <div
              className={clsx(
                "text-xs px-4 py-1 shadow-md transition-all ease-in-out duration-500 gap-2 hover:cursor-pointer overflow-x-hidden relative justify-center",
                colorScheme === "dark" ? "bg-dark-800" : "bg-gray-50",
                opened && "w-full max-h-80 mx-3 items-start overflow-y-auto",
                !opened && "w-44 overflow-y-hidden max-h-6"
              )}
              style={{
                borderRadius: "1rem",
                boxShadow: "0px 0px 5px 0px #7c3aed",
              }}
              onClick={open}
              ref={ref}
            >
              <div
                className={clsx(
                  "flex gap-2 justify-center items-center font-bold font-greycliff sticky w-full top-0 z-50",
                  colorScheme === "dark" ? "text-dark-100" : "text-violet-500"
                )}
              >
                <IconPin size={14} />
                <div>Pinned Messages</div>
                {!opened && (
                  <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                    <div
                      style={{ fontSize: "10px" }}
                      className="text-violet-200"
                    >
                      {pinnedMessages.length}
                    </div>
                  </div>
                )}
                {opened && (
                  <ActionIcon
                    size="xs"
                    color="violet"
                    onClick={(e) => {
                      e.stopPropagation();
                      ref.current.scrollTo({ top: 0, behavior: "smooth" });
                      close();
                    }}
                  >
                    <IconX
                      className={clsx(
                        colorScheme === "dark"
                          ? "text-dark-200"
                          : "text-violet-500"
                      )}
                      size={14}
                    />
                  </ActionIcon>
                )}
              </div>
              <div className="w-full mt-3 flex-1">
                {pinnedMessages.map((msg) => (
                  <MessageItem
                    onPinnedMessageBox={true}
                    {...msg}
                    key={msg.id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
