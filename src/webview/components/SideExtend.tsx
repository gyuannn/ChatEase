import { useMantineTheme, clsx } from "@mantine/core";
import { useAppSelector } from "../hooks/redux";
import { ChatHistory } from "./ChatHistory/ChatHistory";
import { PromptsList } from "./Prompt/PromptsList";

const renderBoxByModuleSelected = (selectedMode: string) => {
  if (selectedMode === "chat") {
    return <ChatHistory />;
  }

  if (selectedMode === "action") {
    return <PromptsList />;
  }
};

export const SideExtend = () => {
  const selectedMode = useAppSelector((state) => state.app.selectedAppModule);

  const sideNavExpanded = useAppSelector((state) => state.app.sideNavExpanded);

  const { colorScheme } = useMantineTheme();

  return (
    <div
      className={clsx(
        "h-full py-1 transition-all overflow-hidden border-solid border-0 border-r",
        colorScheme === "light" && "bg-white border-gray-200",
        colorScheme === "dark" && "bg-dark-750 border-dark-750"
      )}
      style={{
        width: sideNavExpanded ? "16rem" : "0px",
        opacity: sideNavExpanded ? "1" : "0",
      }}
    >
      {renderBoxByModuleSelected(selectedMode)}
    </div>
  );
};