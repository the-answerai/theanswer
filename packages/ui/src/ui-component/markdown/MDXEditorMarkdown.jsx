import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { MDXEditor } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    imagePlugin,
    linkPlugin,
    InsertImage,
    diffSourcePlugin,
    DiffSourceToggleWrapper,
    markdownShortcutPlugin
} from '@mdxeditor/editor'

export default function MDXEditorMarkdown({ markdown, onChange }) {
    const [currentMarkdown, setCurrentMarkdown] = useState(markdown)
    const [initialMarkdown, setInitialMarkdown] = useState(markdown)

    useEffect(() => {
        setCurrentMarkdown(markdown)
        setInitialMarkdown(markdown)
    }, [markdown])

    const handleChange = (newMarkdown) => {
        setCurrentMarkdown(newMarkdown)
        onChange(newMarkdown)
    }
    return (
        <MDXEditor
            markdown={markdown}
            onChange={onChange}
            plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                linkPlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),
                toolbarPlugin({
                    toolbarContents: () => (
                        <>
                            {' '}
                            <UndoRedo />
                            <BoldItalicUnderlineToggles />
                            <InsertImage />
                            <DiffSourceToggleWrapper>
                                <UndoRedo />
                            </DiffSourceToggleWrapper>
                        </>
                    )
                }),
                imagePlugin({
                    imageUploadHandler: () => {
                        return Promise.resolve('https://picsum.photos/200/300')
                    },
                    imageAutocompleteSuggestions: ['https://picsum.photos/200/300', 'https://picsum.photos/200']
                }),
                diffSourcePlugin({
                    diffMarkdown: initialMarkdown,
                    viewMode: 'rich-text',
                    // Update the diffMarkdown when the "Compare" button is clicked
                    onDiffMarkdownChange: setInitialMarkdown
                })
            ]}
        />
    )
}
MDXEditorMarkdown.propTypes = {
    markdown: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
}
