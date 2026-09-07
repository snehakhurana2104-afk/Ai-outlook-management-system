import React,{
memo,
useMemo,
} from "react";

import{
ShieldCheck,
Wifi,
Database,
Cloud,
RefreshCw,
}from"lucide-react";

const OutlookHealth=({

status,

})=>{

const health=useMemo(()=>status||{},[status]);

return(

<section className="dashboard-card outlook-health-card">

<div className="card-header">

<h3>

<ShieldCheck size={20}/>

System Health

</h3>

</div>

<div className="health-grid">

<div className="health-item">

<Wifi size={18}/>

<span>

Microsoft Graph

</span>

<strong>

{health.graphStatus || "Connected"}

</strong>

</div>

<div className="health-item">

<Database size={18}/>

<span>

MongoDB

</span>

<strong>

{health.databaseStatus || "Connected"}

</strong>

</div>

<div className="health-item">

<Cloud size={18}/>

<span>

Socket.IO

</span>

<strong>

{health.socketStatus || "Connected"}

</strong>

</div>

<div className="health-item">

<RefreshCw size={18}/>

<span>

Last Sync

</span>

<strong>

{health.lastSync || "--"}

</strong>

</div>

</div>

</section>

);

};

export default memo(OutlookHealth);