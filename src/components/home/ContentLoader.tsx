
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type PageContent = {
  id: string;
  page: string;
  section: string;
  key: string;
  content: string;
  content_type: string;
};

// Custom hook to fetch page content for the index page
export const useIndexPageContent = (section?: string) => {
  const { data: pageContents = [], isLoading } = useQuery({
    queryKey: ["page-contents", "index", section],
    queryFn: async () => {
      try {
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
        
        return data as PageContent[];
      } catch (error) {
        console.error("Error in useIndexPageContent:", error);
        return [];
      }
    },
  });

  // Helper function to get content by section and key
  const getContent = (sectionName: string, key: string, defaultValue: string = "") => {
    const content = pageContents.find(
      (item) => item.section === sectionName && item.key === key
    );
    return content ? content.content : defaultValue;
  };

  return { pageContents, isLoading, getContent };
};
