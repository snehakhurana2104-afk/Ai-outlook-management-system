// ===========================================================
// ExecutiveSummaryCards.jsx
// Executive KPI Dashboard Cards
// Microsoft 365 Admin Center Style
// ===========================================================


import React, {
 memo
} from "react";


import {
 Mail,
 Reply,
 Clock,
 CheckCircle,
 AlertTriangle,
 Users,
 Building2,
 TrendingUp
} from "lucide-react";


import "./ReportsComponents.css";





const ExecutiveSummaryCards = ({
 data
}) => {



if(!data)
return null;





const cards = [

{
title:"Total Emails",
value:data.totalEmails,
icon:<Mail/>
},


{
title:"Total Replies",
value:data.totalReplies,
icon:<Reply/>
},


{
title:"Pending Emails",
value:data.pendingEmails,
icon:<Clock/>
},


{
title:"Completed Emails",
value:data.completedEmails,
icon:<CheckCircle/>
},


{
title:"High Priority",
value:data.highPriorityEmails,
icon:<AlertTriangle/>
},


{
title:"Avg Response Time",
value:data.averageResponseTime,
icon:<TrendingUp/>
},


{
title:"Response Rate",
value:data.responseRate,
icon:<Users/>
},


{
title:"Active Companies",
value:data.activeCompanies,
icon:<Building2/>
}


];







return (


<section className="executive-summary-grid">


{
cards.map(
(card,index)=>(


<div

className="summary-card"

key={index}

>


<div className="summary-icon">

{
card.icon
}

</div>




<div className="summary-content">


<p>

{card.title}

</p>



<h2>

{
card.value ??
0
}

</h2>



</div>



</div>



)

)

}



</section>



);


};



export default memo(
ExecutiveSummaryCards
);