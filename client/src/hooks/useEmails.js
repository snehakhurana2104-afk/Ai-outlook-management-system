import { useState, useEffect, useCallback } from "react";
import { getEmails } from "../services/emailApi";

const useEmails = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getEmails();

      if (response.success) {
        setEmails(response.data || []);
      } else {
        setError(response.message || "Unable to load emails");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load emails");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  return {
    emails,
    loading,
    error,
    refreshEmails: fetchEmails,
  };
};

export default useEmails;