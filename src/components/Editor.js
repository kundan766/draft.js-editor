import React from "react";


import { Editor, EditorState, RichUtils, getDefaultKeyBinding, convertFromRaw, convertToRaw } from "draft-js";
import "./Editor.css";


class Texteditor extends React.Component {
    constructor(props) {
      super(props);
      this.state = {editorState: EditorState.createEmpty()};

      // added stuff
      

      const savedEditorState = localStorage.getItem('editorState');
      const editorState = savedEditorState
        ? EditorState.createWithContent(convertFromRaw(JSON.parse(savedEditorState)))
        : EditorState.createEmpty();
    
      this.state = {
        editorState: editorState,
      };



      this.focus = () => this.refs.editor.focus();
      this.onChange = (editorState) => this.setState({editorState});

      this.handleKeyCommand = this._handleKeyCommand.bind(this);
      this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
      this.toggleBlockType = this._toggleBlockType.bind(this);
      this.toggleInlineStyle = this._toggleInlineStyle.bind(this);

      // added for save in localstorage

      this._saveContent = this._saveContent.bind(this);
    }
    

    _handleKeyCommand(command, editorState) {
      const newState = RichUtils.handleKeyCommand(editorState, command);

      // added

      if (!newState) {
        const contentState = editorState.getCurrentContent();
        const selection = editorState.getSelection();
        const startKey = selection.getStartKey();
        const currentBlock = contentState.getBlockForKey(startKey);
        const text = currentBlock.getText();
  
        // Check for special characters at the beginning of a line
        if (text.startsWith('# ')) {
          this.onChange(RichUtils.toggleBlockType(editorState, 'header-one'));
          return true;
        } else if (text.startsWith('* ')) {
          this.onChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
          return true;
        } else if (text.startsWith('** ')) {
          this.onChange(RichUtils.toggleInlineStyle(editorState, 'CODE'));
          return true;
        } else if (text.startsWith('*** ')) {
          this.onChange(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
          return true;
        }
      }



      if (newState) {
        this.onChange(newState);
        return true;
      }
      return false;
    }

    _mapKeyToEditorCommand(e) {
      if (e.keyCode === 9 /* TAB */) {
        const newEditorState = RichUtils.onTab(
          e,
          this.state.editorState,
          4, /* maxDepth */
        );
        if (newEditorState !== this.state.editorState) {
          this.onChange(newEditorState);
        }
        return;
      }
      return getDefaultKeyBinding(e);
    }

    _toggleBlockType(blockType) {
      this.onChange(
        RichUtils.toggleBlockType(
          this.state.editorState,
          blockType
        )
      );
    }

    _toggleInlineStyle(inlineStyle) {
      this.onChange(
        RichUtils.toggleInlineStyle(
          this.state.editorState,
          inlineStyle
        )
      );
    }

    // added for storing stuff

   
    // adade 2


    _saveContent() {
      try {
        // Save editor state to localStorage
        const contentState = this.state.editorState.getCurrentContent();
        const contentStateJSON = JSON.stringify(convertToRaw(contentState));
        localStorage.setItem('editorState', contentStateJSON);
        console.log("Content saved successfully");
      } catch (error) {
        console.error("Error saving content:", error);
      }
    }



    render() {
      const {editorState} = this.state;

      // If the user changes block type before entering any text, we can
      // either style the placeholder or hide it. Let's just hide it now.
      let className = 'RichEditor-editor';
      var contentState = editorState.getCurrentContent();
      if (!contentState.hasText()) {
        if (contentState.getBlockMap().first().getType() !== 'unstyled') {
          className += ' RichEditor-hidePlaceholder';
        }
      }

      return (
        <div className="RichEditor-root">

            <h3 className="heading">Demo editor By Kundan choudhary</h3>
            <button className="button"  onClick={this._saveContent} >Save</button>
          <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
          />
          <InlineStyleControls
            editorState={editorState}
            onToggle={this.toggleInlineStyle}
          />
          <div className={className} onClick={this.focus}>
            <Editor
              blockStyleFn={getBlockStyle}
              customStyleMap={styleMap}
              editorState={editorState}
              handleKeyCommand={this.handleKeyCommand}
              keyBindingFn={this.mapKeyToEditorCommand}
              onChange={this.onChange}
              placeholder="Tell a story..."
              ref="editor"
              spellCheck={true}
            />
          </div>
        </div>
      );
    }
  }

  // Custom overrides for "code" style.
  const styleMap = {
    CODE: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
      fontSize: 16,
      padding: 2,
    },
  };

  function getBlockStyle(block) {
    switch (block.getType()) {
      case 'blockquote': return 'RichEditor-blockquote';
      default: return null;
    }
  }

  class StyleButton extends React.Component {
    constructor() {
      super();
      this.onToggle = (e) => {
        e.preventDefault();
        this.props.onToggle(this.props.style);
      };
    }

    render() {
      let className = 'RichEditor-styleButton';
      if (this.props.active) {
        className += ' RichEditor-activeButton';
      }

      return (
        <span className={className} onMouseDown={this.onToggle}>
          {this.props.label}
        </span>
      );
    }
  }

  const BLOCK_TYPES = [
    {label: 'H1', style: 'header-one'},
    {label: 'H2', style: 'header-two'},
    {label: 'H3', style: 'header-three'},
    {label: 'H4', style: 'header-four'},
    {label: 'H5', style: 'header-five'},
    {label: 'H6', style: 'header-six'},
    {label: 'Blockquote', style: 'blockquote'},
    {label: 'UL', style: 'unordered-list-item'},
    {label: 'OL', style: 'ordered-list-item'},
    {label: 'Code Block', style: 'code-block'},
  ];

  const BlockStyleControls = (props) => {
    const {editorState} = props;
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();

    return (
      <div className="RichEditor-controls">
        {BLOCK_TYPES.map((type) =>
          <StyleButton
            key={type.label}
            active={type.style === blockType}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
  };

  var INLINE_STYLES = [
    {label: 'Bold', style: 'BOLD'},
    {label: 'Italic', style: 'ITALIC'},
    {label: 'Underline', style: 'UNDERLINE'},
    {label: 'Monospace', style: 'CODE'},
  ];

  const InlineStyleControls = (props) => {
    const currentStyle = props.editorState.getCurrentInlineStyle();
    
    return (
      <div className="RichEditor-controls">
        {INLINE_STYLES.map((type) =>
          <StyleButton
            key={type.label}
            active={currentStyle.has(type.style)}
            label={type.label}
            onToggle={props.onToggle}
            style={type.style}
          />
        )}
      </div>
    );
  };

  export default Texteditor;

