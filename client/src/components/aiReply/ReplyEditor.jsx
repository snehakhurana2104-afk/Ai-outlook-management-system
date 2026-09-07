// ===========================================================
// ReplyEditor.jsx
// PHASE 5 - PART 5
// Enterprise AI Reply Editor
// Imports + State + Editor Foundation
// ===========================================================

import React, {
    memo,
    useCallback,
    useMemo,
    useRef,
} from "react";

import {
    Edit3,
    FileText,
} from "lucide-react";

import "./ReplyEditor.css";


// ===========================================================
// Component
// ===========================================================

const ReplyEditor = ({
    value = "",
    onChange,
}) => {


    const textareaRef =
        useRef(null);



    // =======================================================
    // Character Count
    // =======================================================

    const characterCount =
        useMemo(
            () =>
                value.length,
            [
                value
            ]
        );



    // =======================================================
    // Change Handler
    // =======================================================

    const handleChange =
        useCallback(
            (event)=>{


                const text =
                    event.target.value;


                onChange(
                    text
                );


                // Auto resize

                if(
                    textareaRef.current
                ){

                    textareaRef.current.style.height =
                        "auto";


                    textareaRef.current.style.height =
                        `${textareaRef.current.scrollHeight}px`;

                }


            },
            [
                onChange
            ]
        );



    return (

        <div className="reply-editor">


            {/* Header */}

            <div className="reply-editor-header">


                <div className="editor-title">


                    <Edit3 size={18}/>


                    <h4>
                        AI Reply Draft
                    </h4>


                </div>



                <div className="editor-count">

                    {characterCount}

                    {" "}

                    characters

                </div>


            </div>





            {/* Editor Area */}

            <div className="reply-editor-body">


                <FileText size={18}/>


                <textarea

                    ref={textareaRef}

                    value={value}

                    onChange={
                        handleChange
                    }

                    placeholder="
                    AI generated reply will appear here...
                    "

                    rows={8}

                />


            </div>


        </div>

    );

};


export default memo(
    ReplyEditor
);