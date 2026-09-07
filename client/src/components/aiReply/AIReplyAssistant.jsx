// ===========================================================
// AIReplyAssistant.jsx
// PHASE 5
// Enterprise AI Reply Assistant
// Part 1
// ===========================================================

import React, {
    memo,
    useState,
    useEffect,
    useCallback,
    useMemo,
    lazy,
    Suspense,
} from "react";

import {
    Sparkles,
    RefreshCw,
    Send,
    Copy,
    CheckCircle2,
    Brain,
    Clock3,
} from "lucide-react";

import toast from "react-hot-toast";

import {
    generateReply,
    regenerateReply,
    sendReply,
} from "../../services/aiReplyService";

import "./AIReplyAssistant.css";


// ===========================================================
// Lazy Components
// ===========================================================

const ReplyEditor = lazy(() =>
    import("./ReplyEditor")
);


const ToneSelector = lazy(() =>
    import("./ToneSelector")
);


const AIReplyPrompts = lazy(() =>
    import("./AIReplyPrompts")
);


const ReplyHistory = lazy(() =>
    import("./ReplyHistory")
);


const AIReplyLoader = lazy(() =>
    import("./AIReplyLoader")
);


// ===========================================================
// Component
// ===========================================================

const AIReplyAssistant = ({
    email,
}) => {


    // =======================================================
    // States
    // =======================================================

    const [reply,setReply] =
        useState("");


    const [loading,setLoading] =
        useState(false);


    const [sending,setSending] =
        useState(false);


    const [confidence,setConfidence] =
        useState(0);


    const [tone,setTone] =
        useState("Professional");


    const [history,setHistory] =
        useState([]);


    const [summary,setSummary] =
        useState("");


    const [sentiment,setSentiment] =
        useState("");


    const [keywords,setKeywords] =
        useState([]);


    const [lastGenerated,setLastGenerated] =
        useState(null);



    // =======================================================
    // Derived State
    // =======================================================

    const hasReply = useMemo(
        () =>
            reply.trim().length > 0,
        [reply]
    );



    // =======================================================
    // Generate AI Reply
    // =======================================================

    const handleGenerate =
        useCallback(async()=>{


            if(!email)
                return;


            try{


                setLoading(true);


                const response =
                    await generateReply({

                        emailId:
                            email._id,

                        tone,

                    });



                setReply(
                    response.reply || ""
                );


                setConfidence(
                    response.confidence || 0
                );


                setSummary(
                    response.summary || ""
                );


                setSentiment(
                    response.sentiment || ""
                );


                setKeywords(
                    response.keywords || []
                );


                setLastGenerated(
                    new Date()
                );


                toast.success(
                    "AI reply generated"
                );


            }
            catch(error){


                console.error(error);


                toast.error(
                    "AI generation failed"
                );


            }
            finally{


                setLoading(false);


            }


        },
        [
            email,
            tone
        ]);



    // =======================================================
    // Auto Generate
    // =======================================================

    useEffect(()=>{


        if(email?._id)
        {

            handleGenerate();

        }


    },[
        email,
        handleGenerate
    ]);



    // =======================================================
    // Regenerate Reply
    // =======================================================

    const handleRegenerate =
        useCallback(async()=>{


            try{


                setLoading(true);


                const response =
                    await regenerateReply({

                        emailId:
                            email._id,

                        tone,

                        previousReply:
                            reply,

                    });



                setReply(
                    response.reply || ""
                );


                setConfidence(
                    response.confidence || 0
                );


                setLastGenerated(
                    new Date()
                );


                setHistory(prev=>[

                    ...prev,

                    {

                        reply:
                            response.reply,

                        tone,

                        createdAt:
                            new Date()

                    }

                ]);


                toast.success(
                    "Reply regenerated"
                );


            }
            catch(error){


                console.error(error);


                toast.error(
                    "Regenerate failed"
                );


            }
            finally{


                setLoading(false);


            }


        },
        [
            email,
            tone,
            reply
        ]);
            // =======================================================
    // Copy Reply
    // =======================================================

    const handleCopy =
        useCallback(()=>{


            if(!reply)
                return;


            navigator.clipboard.writeText(
                reply
            );


            toast.success(
                "Reply copied"
            );


        },[
            reply
        ]);



    // =======================================================
    // Send Reply
    // =======================================================

    const handleSend =
        useCallback(async()=>{


            if(!reply.trim())
            {

                toast.error(
                    "Reply is empty"
                );

                return;

            }



            try{


                setSending(true);



                await sendReply({

                    emailId:
                        email._id,

                    content:
                        reply,

                });



                toast.success(
                    "Reply sent successfully"
                );


            }
            catch(error){


                console.error(error);


                toast.error(
                    "Failed to send reply"
                );


            }
            finally{


                setSending(false);


            }


        },[
            email,
            reply
        ]);



    // =======================================================
    // Prompt Selection
    // =======================================================

    const handlePromptSelect =
        useCallback((prompt)=>{


            setReply(prompt.prompt);


        },[]);



    // =======================================================
    // UI
    // =======================================================

    return (

        <section className="ai-reply-assistant">


            {/* =========================================
                    Header
            ========================================== */}

            <div className="ai-reply-header">


                <div className="ai-title">


                    <Sparkles size={22}/>


                    <div>

                        <h3>
                            AI Suggested Reply
                        </h3>


                        <p>
                            Microsoft Copilot style assistant
                        </p>


                    </div>


                </div>



                <div className="ai-status">


                    <Brain size={18}/>


                    <span>
                        AI Ready
                    </span>


                </div>


            </div>



            {/* =========================================
                    AI Metrics
            ========================================== */}

            <div className="ai-metrics">


                <div className="metric-card">


                    <CheckCircle2 size={18}/>


                    <div>

                        <span>
                            Confidence
                        </span>


                        <strong>
                            {confidence}%
                        </strong>


                    </div>


                </div>



                <div className="metric-card">


                    <Clock3 size={18}/>


                    <div>

                        <span>
                            Generated
                        </span>


                        <strong>

                            {
                                lastGenerated
                                ?
                                lastGenerated.toLocaleTimeString()
                                :
                                "--"
                            }

                        </strong>


                    </div>


                </div>


            </div>




            {/* =========================================
                    Controls
            ========================================== */}

            <div className="ai-controls">


                <Suspense fallback={null}>


                    <ToneSelector

                        value={tone}

                        onChange={setTone}

                    />


                </Suspense>



                <button

                    className="ai-btn primary"

                    onClick={handleGenerate}

                    disabled={loading}

                >

                    <Sparkles size={17}/>


                    Generate


                </button>



                <button

                    className="ai-btn secondary"

                    onClick={handleRegenerate}

                    disabled={loading}

                >

                    <RefreshCw size={17}/>


                    Regenerate


                </button>


            </div>




            {/* =========================================
                    Loader
            ========================================== */}

            {
                loading &&

                <Suspense fallback={null}>

                    <AIReplyLoader/>

                </Suspense>

            }




            {/* =========================================
                    Smart Prompts
            ========================================== */}

            <Suspense fallback={null}>


                <AIReplyPrompts

                    onSelectPrompt={
                        handlePromptSelect
                    }

                    disabled={
                        loading
                    }

                />


            </Suspense>




            {/* =========================================
                    Reply Editor
            ========================================== */}

            <div className="reply-workspace">


                <Suspense fallback={null}>


                    <ReplyEditor

                        value={reply}

                        onChange={setReply}

                    />


                </Suspense>



                <div className="reply-actions">



                    <button

                        className="reply-btn secondary"

                        onClick={handleCopy}

                        disabled={!hasReply}

                    >

                        <Copy size={17}/>


                        Copy


                    </button>




                    <button

                        className="reply-btn primary"

                        onClick={handleSend}

                        disabled={
                            sending ||
                            !hasReply
                        }

                    >

                        <Send size={17}/>


                        {
                            sending
                            ?
                            "Sending..."
                            :
                            "Send Reply"
                        }


                    </button>


                </div>


            </div>
                        {/* =========================================
                    AI Analysis Context
            ========================================== */}

            <div className="ai-context-card">


                <div className="context-header">


                    <Brain size={18}/>


                    <h4>
                        AI Email Analysis
                    </h4>


                </div>



                <div className="context-content">



                    {/* Sentiment */}

                    <div className="context-item">


                        <span>
                            Sentiment
                        </span>


                        <strong>

                            {
                                sentiment ||
                                "Unknown"
                            }

                        </strong>


                    </div>




                    {/* Summary */}

                    <div className="context-item">


                        <span>
                            Email Summary
                        </span>


                        <p>

                            {
                                summary ||
                                "No AI summary available."
                            }

                        </p>


                    </div>




                    {/* Keywords */}

                    <div className="context-item">


                        <span>
                            Important Keywords
                        </span>



                        <div className="keyword-list">


                            {
                                keywords.length > 0
                                ?

                                keywords.map(
                                    (word,index)=>(

                                        <span

                                            key={index}

                                            className="keyword"

                                        >

                                            {word}

                                        </span>

                                    )
                                )

                                :

                                (

                                    <span>

                                        No keywords detected

                                    </span>

                                )

                            }


                        </div>


                    </div>



                </div>


            </div>





            {/* =========================================
                    Reply History
            ========================================== */}

            <Suspense fallback={null}>


                <ReplyHistory

                    history={history}

                    onRestore={(item)=>{


                        setReply(
                            item.reply
                        );


                        setTone(
                            item.tone
                        );


                        toast.success(
                            "Previous reply restored"
                        );


                    }}

                />


            </Suspense>





        </section>

    );

};



// ===========================================================
// Export
// ===========================================================

export default memo(
    AIReplyAssistant
);