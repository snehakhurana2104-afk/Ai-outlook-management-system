// ===========================================================
// AIReplyLoader.jsx
// PHASE 5 - PART 9
// Enterprise AI Reply Generation Loader
// ===========================================================

import React, {
    memo,
} from "react";

import {
    Sparkles,
    Brain,
} from "lucide-react";

import "./AIReplyLoader.css";



// ===========================================================
// Component
// ===========================================================

const AIReplyLoader = () => {


    return (

        <div className="ai-reply-loader">


            {/* Icon */}

            <div className="loader-icon">


                <Sparkles size={24}/>


            </div>





            {/* Content */}

            <div className="loader-content">


                <div className="loader-title">


                    <Brain size={18}/>


                    <h4>
                        AI is preparing your reply
                    </h4>


                </div>



                <p>

                    Analyzing email context,
                    tone and conversation history

                </p>



                {/* Animated Dots */}

                <div className="loader-dots">


                    <span></span>

                    <span></span>

                    <span></span>


                </div>


            </div>


        </div>

    );

};



export default memo(
    AIReplyLoader
);