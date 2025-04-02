
import { useState, useEffect } from 'react';
import { migrateRecentStoryImages } from '@/lib/imageStorage';

export const useMigrateStoryImages = (autoMigrate: boolean = false, limit: number = 10) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (autoMigrate) {
      const migrateImages = async () => {
        try {
          setIsMigrating(true);
          setError(null);
          
          await migrateRecentStoryImages(limit);
          
          setMigrationComplete(true);
        } catch (err) {
          console.error("Error migrating images automatically:", err);
          setError(err instanceof Error ? err : new Error("Failed to migrate images"));
        } finally {
          setIsMigrating(false);
        }
      };
      
      // Check if we've already migrated images in this session
      const lastMigration = sessionStorage.getItem('last_image_migration');
      const shouldMigrate = !lastMigration || 
        (Date.now() - parseInt(lastMigration)) > 3600000; // 1 hour
      
      if (shouldMigrate) {
        migrateImages();
        sessionStorage.setItem('last_image_migration', Date.now().toString());
      } else {
        console.log("Skipping automatic image migration - already performed recently");
      }
    }
  }, [autoMigrate, limit]);

  const triggerMigration = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      
      await migrateRecentStoryImages(limit);
      
      setMigrationComplete(true);
      sessionStorage.setItem('last_image_migration', Date.now().toString());
    } catch (err) {
      console.error("Error in manual image migration:", err);
      setError(err instanceof Error ? err : new Error("Failed to migrate images"));
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    isMigrating,
    migrationComplete,
    error,
    triggerMigration
  };
};
