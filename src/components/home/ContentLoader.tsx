
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

// Custom hook to fetch page content for the index page
export const useIndexPageContent = (section?: string) => {
  const [localIsLoading, setLocalIsLoading] = useState(true);

  const { data: pageContents = [], isLoading: queryIsLoading } = useQuery({
    queryKey: ["page-contents", "index", section],
    queryFn: async () => {
      const query = supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index");
        
      if (section) {
        query.eq("section", section);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`Error fetching page contents for section ${section}:`, error);
        return [];
      }
      
      return data;
    },
  });

  // Helper function to get content by section and key
  const getContent = (sectionName: string, key: string, defaultValue: string = "") => {
    const content = pageContents.find(
      (item: any) => item.section === sectionName && item.key === key
    );
    return content ? content.content : defaultValue;
  };

  // Set loading to false when query is done
  useEffect(() => {
    if (!queryIsLoading) {
      // Add small delay to ensure content is processed
      const timer = setTimeout(() => {
        setLocalIsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [queryIsLoading]);

  return { 
    pageContents, 
    isLoading: localIsLoading, 
    getContent 
  };
};
