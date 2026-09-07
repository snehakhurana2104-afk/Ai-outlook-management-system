// ===========================================================
// AIReplyPrompts.jsx
// PHASE 5 - PART 7
// Smart AI Reply Prompt Suggestions
// ===========================================================

import React, {
    memo,
    useMemo,
} from "react";

import {
    MessageSquareText,
    CalendarCheck,
    UserRoundPlus,
    CreditCard,
    GraduationCap,
    RefreshCcw,
    Sparkles,
} from "lucide-react";

import "./AIReplyPrompts.css";


// ===========================================================
// Component
// ===========================================================

const AIReplyPrompts = ({
    onSelectPrompt,
    disabled = false,
}) => {


    // =======================================================
    // AI Prompt Library
    // =======================================================

    const prompts = useMemo(
        () => [

            {
                id: "thank_customer",

                title:
                    "Thank Customer",

                description:
                    "Create professional appreciation reply",

                icon:
                    MessageSquareText,

                prompt:
                    "Write a professional thank you response to the customer."
            },


            {
                id: "schedule_meeting",

                title:
                    "Schedule Meeting",

                description:
                    "Create meeting confirmation reply",

                icon:
                    CalendarCheck,

                prompt:
                    "Write a professional reply to schedule a meeting."
            },


            {
                id: "request_information",

                title:
                    "Request Details",

                description:
                    "Ask required information",

                icon:
                    UserRoundPlus,

                prompt:
                    "Write a professional email requesting additional information."
            },


            {
                id: "payment_followup",

                title:
                    "Payment Reminder",

                description:
                    "Create polite payment follow-up",

                icon:
                    CreditCard,

                prompt:
                    "Write a polite payment follow-up email."
            },


            {
                id: "training_confirmation",

                title:
                    "Training Confirmation",

                description:
                    "Confirm training details",

                icon:
                    GraduationCap,

                prompt:
                    "Write a professional training confirmation reply."
            },


            {
                id: "follow_up",

                title:
                    "Follow Up",

                description:
                    "Create follow-up email",

                icon:
                    RefreshCcw,

                prompt:
                    "Write a professional follow-up email."
            },


        ],
        []
    );



    return (

        <section className="ai-reply-prompts">


            {/* Header */}

            <div className="prompt-header">


                <Sparkles size={18}/>


                <h3>
                    Smart Reply Suggestions
                </h3>


            </div>





            {/* Prompt Cards */}

            <div className="prompt-grid">


                {
                    prompts.map(
                        (item)=>{


                            const Icon =
                                item.icon;


                            return (

                                <button

                                    key={
                                        item.id
                                    }

                                    type="button"

                                    className="prompt-card"

                                    disabled={
                                        disabled
                                    }

                                    onClick={()=>

                                        onSelectPrompt(
                                            item
                                        )

                                    }

                                >

                                    <Icon
                                        size={20}
                                    />



                                    <div>


                                        <h4>

                                            {
                                                item.title
                                            }

                                        </h4>


                                        <p>

                                            {
                                                item.description
                                            }

                                        </p>


                                    </div>


                                </button>

                            );


                        }
                    )
                }


            </div>


        </section>

    );

};


export default memo(
    AIReplyPrompts
);