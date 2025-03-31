import React, {ReactNode} from "react";
import {Text} from 'react-native-paper';
import _Markdown, {RenderRules} from "react-native-markdown-display";

interface ITextNode {
  key: string;
  content: string;
}

interface IStylesNode {
  text: object;
  textgroup: object;
}

const rules:RenderRules = {
  text: (
    node: ITextNode,
    children: ReactNode[],
    parent: unknown,
    styles: IStylesNode,
    inheritedStyles = {},
  ) => (
    <Text key={node.key} style={[inheritedStyles, styles.text]} selectable>
      {node.content}
    </Text>
  ),
  textgroup: (
    node: ITextNode,
    children: ReactNode[],
    parent: unknown,
    styles: IStylesNode,
  ) => (
    <Text key={node.key} style={styles.textgroup} selectable>
      {children}
    </Text>
  ),
};

const Markdown = ({children}: { children: ReactNode }) => {
  return (
    <_Markdown rules={rules} style={{body: {fontSize: 15}}}>
      {children}
    </_Markdown>
  )
}

export default Markdown;
