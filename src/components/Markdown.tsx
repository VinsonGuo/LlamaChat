import React, {ReactNode} from "react";
import {Text} from 'react-native-paper';
import _Markdown, {RenderRules} from "react-native-markdown-display";

const Markdown = ({children}: { children: ReactNode }) => {
  return (
    <_Markdown style={{body: {fontSize: 16}}}>
      {children}
    </_Markdown>
  )
}

export default Markdown;
