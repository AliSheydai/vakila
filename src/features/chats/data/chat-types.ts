import type convoData from './convo.json'

export type ChatUser = (typeof convoData.conversations)[number]
export type Convo = ChatUser['messages'][number]
