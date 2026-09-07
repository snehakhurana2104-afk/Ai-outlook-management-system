// ===========================================================
// useReportsSocket.js
// Microsoft Graph Live Report Synchronization Hook
// ===========================================================


import {
  useEffect,
} from "react";


import socket from "../services/socket";





export const useReportsSocket = ({
  onEmailUpdate,
  onSyncCompleted,
  onReportUpdate,
}) => {



  useEffect(() => {


    if (!socket) {

      console.warn(
        "Socket service unavailable"
      );

      return;

    }



    // New Outlook Email Received

    socket.on(
      "new-email",
      () => {


        if (onEmailUpdate) {

          onEmailUpdate();

        }


      }
    );






    // Outlook Sync Completed

    socket.on(
      "sync-completed",
      () => {


        if (onSyncCompleted) {

          onSyncCompleted();

        }


      }
    );







    // Report Data Updated

    socket.on(
      "reports-updated",
      (data)=>{


        if(onReportUpdate){

          onReportUpdate(data);

        }


      }
    );








    return ()=>{


      socket.off(
        "new-email"
      );


      socket.off(
        "sync-completed"
      );


      socket.off(
        "reports-updated"
      );


    };




  },[
    onEmailUpdate,
    onSyncCompleted,
    onReportUpdate
  ]);



};


export default useReportsSocket;