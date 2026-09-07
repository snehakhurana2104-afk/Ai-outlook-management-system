import win32com.client
from win32com.client import gencache, Dispatch
import json
import sys
import datetime


emails = []


try:

    # ======================================
    # Outlook Connect
    # ======================================

    try:
        outlook = Dispatch("Outlook.Application")

    except Exception:

        try:
            outlook = gencache.EnsureDispatch(
                "Outlook.Application"
            )

        except Exception:

            gencache.Rebuild()

            outlook = Dispatch(
                "Outlook.Application"
            )


    namespace = outlook.GetNamespace("MAPI")


    # ======================================
    # Inbox
    # ======================================

    inbox = namespace.GetDefaultFolder(6)

    messages = inbox.Items


    # Latest First
    messages.Sort(
        "[ReceivedTime]",
        True
    )


    # ======================================
    # Last 30 Days Emails
    # ======================================

    days = 30

    start_date = (
        datetime.datetime.now()
        -
        datetime.timedelta(days=days)
    )


    filter_date = start_date.strftime(
        "%m/%d/%Y %I:%M %p"
    )


    try:

        messages = messages.Restrict(
            f"[ReceivedTime] >= '{filter_date}'"
        )


    except Exception as e:

        print(
            f"Date Filter Error: {e}",
            file=sys.stderr
        )


    # ======================================
    # Limit
    # ======================================

    limit = 1000


    if len(sys.argv) > 1:

        try:
            limit = int(sys.argv[1])

        except:

            pass



    # ======================================
    # Read Emails
    # ======================================

    processed = set()


    for mail in messages:


        if len(emails) >= limit:
            break


        try:


            entry_id = str(
                getattr(
                    mail,
                    "EntryID",
                    ""
                )
            )


            if not entry_id:
                continue


            if entry_id in processed:
                continue


            processed.add(entry_id)



            received = getattr(
                mail,
                "ReceivedTime",
                None
            )


            received_time = ""


            if received:

                received_time = received.strftime(
                    "%Y-%m-%dT%H:%M:%S"
                )



            print(
                f"Reading: {mail.Subject}",
                file=sys.stderr
            )



            email_data = {


                "messageId": entry_id,


                "senderName": str(
                    getattr(
                        mail,
                        "SenderName",
                        ""
                    )
                ),


                "senderEmail": str(
                    getattr(
                        mail,
                        "SenderEmailAddress",
                        ""
                    )
                ),


                "subject": str(
                    getattr(
                        mail,
                        "Subject",
                        ""
                    )
                ),


                "receivedDateTime": received_time,


                "body": str(
                    getattr(
                        mail,
                        "Body",
                        ""
                    )
                )[:5000],


                "unread": bool(
                    getattr(
                        mail,
                        "UnRead",
                        False
                    )
                )

            }


            emails.append(
                email_data
            )



        except Exception as e:


            print(
                f"Email Read Error: {e}",
                file=sys.stderr
            )


            continue



    # ======================================
    # JSON Output
    # ======================================

    print(
        json.dumps(
            emails,
            ensure_ascii=False,
            indent=2
        )
    )



except Exception as e:


    print(
        json.dumps(
            {
                "success": False,
                "error": str(e)
            },
            ensure_ascii=False
        )
    )


    sys.exit(1)