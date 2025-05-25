'use client'
import * as React from 'react'
// import { CBotProps } from "../types";
import { FullPageChat } from 'aai-embed-react'
import getThemeColors from '../utils/getThemeColors'
import { useChatbotId } from '../hooks/useChatbotId'
import { useTheme } from '../context/ThemeContext'
import { Box, Chip, useTheme as useMuiTheme } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'

// Extend ImportMeta interface to include env
declare global {
    interface ImportMeta {
        env: {
            VITE_ANSWERAI_URL?: string
            VITE_ANSWERAI_HOST?: string
            [key: string]: string | undefined
        }
    }
}

// Extend CBotProps to include wrapperClassName
interface ChatFullPageProps {
    botProps?: Record<string, unknown>
    wrapperClassName?: string
}

const ChatFullPage = ({ wrapperClassName, ...restProps }: ChatFullPageProps) => {
    // const defaultMetaDataFilters: PineconeMetadataFilter = {
    //   // url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB1047",
    //   // source: "https://s3.theanswer.ai/sb1047",
    // };

    const { mode } = useTheme()
    const muiTheme = useMuiTheme()
    const isDarkMode = mode === 'dark'
    const themeColors = getThemeColors('rgb(25, 118, 210)', isDarkMode)
    const { chatflowId, title } = useChatbotId()

    const chatProps = {
        chatflowid: chatflowId,
        apiHost: import.meta.env.VITE_ANSWERAI_HOST || 'http://localhost:4000',
        // chatflowConfig: {
        //   ...getChatflowConfig(defaultMetaDataFilters),
        //   pineconeNamespace: process.env.NEXT_PUBLIC_PINECONE_NAMESPACE,
        // },
        // observersConfig: {
        //   observeUserInput: async (_userInput: string) => {
        //     // Do something here
        //   },

        //   observeLoading: async (_loading: boolean) => {
        //     setIsLoadingState(_loading); // Useful if we want to use this state to change UI.   Also used for initial load of old chat in observeMessages
        //   },

        //   observeMessages: async (messages?: Message[]) => {
        //     if ((messages?.length || 0) <= 1) return;

        //     if (!isLoadingState && !isStreamEnded) {
        //       await setSourcesAndQuestions(messages);
        //     }
        //   },

        //   observeStreamEnd: async (messages?: Message[]) => {
        //     setIsStreamEnded(true); // Set for the first time it was actually streamed
        //     if ((messages?.length || 0) <= 1) return;

        //     await setSourcesAndQuestions(messages);
        //   },
        // },
        theme: {
            button: {
                size: 'medium',
                backgroundColor: themeColors.buttonBackgroundColor,
                iconColor: themeColors.buttonIconColor,
                customIconSrc: 'https://example.com/icon.png',
                bottom: 10,
                right: 10
            },
            chatWindow: {
                showTitle: true,
                title,
                showAgentMessages: false,
                // welcomeMessage:
                //   "📢 Quick Disclaimer: While AI can sometimes make mistakes, just like politicians do (though perhaps not quite as often!), I strive for accuracy. This tool is for educational and entertainment purposes only. Please do your own research and verify information from original sources.",
                errorMessage: 'This is a custom error message',
                backgroundColor: themeColors.chatWindowBackgroundColor,
                height: '100%',
                width: '100%',
                // sourceBubble: {
                //   hideSources: false,
                //   getLabel: (source: any) => {
                //     return (
                //       source?.metadata["loc.pageNumber"] ||
                //       source?.metadata?.["pdf.info.Title"] ||
                //       source?.metadata?.congress
                //     );
                //   },
                //   onSourceClick: (source: any) => {
                //     if (source?.metadata) {
                //       const url =
                //         source.metadata.url ||
                //         source.metadata.sourceUrl ||
                //         source.metadata.soureUrl;
                //       source.metadata.sourceUrl = url;
                //     }
                //     console.log(source);
                //     setCurrentExcerpt(source);
                //   },
                // },
                poweredByTextColor: themeColors.chatWindowPoweredByTextColor,
                botMessage: {
                    backgroundColor: themeColors.botMessageBackgroundColor,
                    textColor: themeColors.botMessageTextColor,
                    showAvatar: false
                },
                userMessage: {
                    backgroundColor: themeColors.userMessageBackgroundColor,
                    textColor: themeColors.userMessageTextColor,
                    showAvatar: false
                },
                textInput: {
                    placeholder: 'Type your message...',
                    backgroundColor: themeColors.textInputBackgroundColor,
                    textColor: themeColors.textInputTextColor,
                    sendButtonColor: themeColors.userMessageBackgroundColor,
                    maxChars: 200,
                    maxCharsWarningMessage: 'You have exceeded the character limit.',
                    autoFocus: true,
                    sendMessageSound: false,
                    receiveMessageSound: false
                },
                feedback: {
                    color: themeColors.feedbackColor
                },
                footer: {
                    textColor: themeColors.footerTextColor
                }
            }
        }
    }

    if (!chatProps?.chatflowid || !chatProps?.apiHost) return null

    return (
        <div
            data-testid='ChatFullPage'
            {...restProps}
            className={`w-full h-full flex flex-col chatbot-wrap${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
            style={{
                height: 'calc(100vh - 120px)',
                maxHeight: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mb: 1,
                    mr: 1
                }}
            >
                <Chip
                    icon={isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    label={`${isDarkMode ? 'Dark' : 'Light'} Mode`}
                    size='small'
                    color={isDarkMode ? 'primary' : 'default'}
                    sx={{
                        ...(isDarkMode && {
                            border: '1px solid #24C3A1',
                            boxShadow: '0 0 5px #24C3A1'
                        })
                    }}
                />
            </Box>
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    ...(isDarkMode && {
                        border: '1px solid #24C3A1',
                        boxShadow: '0 0 10px #24C3A1',
                        borderRadius: '8px'
                    })
                }}
            >
                <FullPageChat
                    {...chatProps}
                    // chatflowid={botProps.chatflowid}
                    // apiHost={botProps.apiHost}
                    // isFullPage={true}
                    // chatflowConfig={botProps.chatflowConfig}
                    // observersConfig={botProps.observersConfig}
                    className='w-full h-full'
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'auto'
                    }}
                />
            </div>
        </div>
    )
}

export default ChatFullPage
