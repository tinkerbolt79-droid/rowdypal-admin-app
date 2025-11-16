import {
  collection,
  query,
  getDocs,
  setDoc,
  doc,
  Timestamp,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from './firebase';

async function copyUpcomingEventsMaintainHistory() {
  try {
    // Get current date
    const currentDate = new Date();

    // Get events that are within 10 days from now
    const upcomingEvents = await getUpcomingEvents(currentDate);

    // Get already served events within the last 10 days to prevent duplicates
    const recentlyServedEvents = await getRecentlyServedEvents(currentDate);

    // Create a map of recently served events using original event ID + date combination
    const recentlyServedMap = new Map();
    recentlyServedEvents.forEach(servedEvent => {
      const servedData = servedEvent.data();
      const eventDate = servedData.date?.toDate ? servedData.date.toDate() : new Date(servedData.date);
      const eventMonthDay = `${eventDate.getMonth()}-${eventDate.getDate()}`;
      const key = `${servedData.originalEventId || servedData.id}-${eventMonthDay}`;
      recentlyServedMap.set(key, true);
    });

    // Filter out events that have already been served within the 10-day window
    const newEventsToServe = upcomingEvents.filter(event => {
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      const eventMonthDay = `${eventDate.getMonth()}-${eventDate.getDate()}`;
      const key = `${event.id}-${eventMonthDay}`;
      return !recentlyServedMap.has(key);
    });

    // Copy new events to events-served collection
    const copyPromises = newEventsToServe.map(async (event) => {
      // Create a new document in events-served collection
      const servedEventRef = doc(collection(db, "events-served"));

      // Add metadata for tracking and history
      const servedEventData = {
        ...event,
        originalEventId: event.id, // Store original event ID
        servedAt: Timestamp.now(), // When this copy was served
        servedForDate: currentDate.toISOString().split('T')[0], // Date when it was served for
        dateServedAs: event.date // Original event date (for reference)
      };

      return setDoc(servedEventRef, servedEventData);
    });

    // Wait for all copy operations to complete
    await Promise.all(copyPromises);

    console.log(`Successfully copied ${newEventsToServe.length} new events to events-served collection`);
    console.log(`${recentlyServedEvents.length} events were already served recently`);
    console.log(`Total events considered: ${upcomingEvents.length}`);

    return {
      copiedEvents: newEventsToServe,
      totalUpcoming: upcomingEvents.length,
      recentlyServed: recentlyServedEvents.length
    };

  } catch (error) {
    console.error("Error copying events:", error);
    throw error;
  }
}

async function getUpcomingEvents(currentDate) {
  try {
    // Query all documents from events collection
    const eventsQuery = query(collection(db, "events"));
    const querySnapshot = await getDocs(eventsQuery);

    const upcomingEvents = [];

    // Filter documents based on date condition
    querySnapshot.forEach((doc) => {
      const eventData = doc.data();
      const eventDate = eventData.date?.toDate ? eventData.date.toDate() : new Date(eventData.date);

      // Validate date
      if (!eventDate || isNaN(eventDate.getTime())) {
        console.warn(`Invalid date for event ${doc.id}:`, eventData.date);
        return;
      }

      // Extract month and day for comparison
      const currentMonth = currentDate.getMonth();
      const currentDay = currentDate.getDate();
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();

      // Create date objects for comparison (using current year)
      const currentDateThisYear = new Date(currentDate.getFullYear(), currentMonth, currentDay);
      const eventDateThisYear = new Date(currentDate.getFullYear(), eventMonth, eventDay);

      // Calculate the difference in days
      const timeDiff = eventDateThisYear.getTime() - currentDateThisYear.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Check if event is within 10 days (including today)
      if (daysDiff >= 0 && daysDiff <= 10) {
        upcomingEvents.push({
          id: doc.id,
          ...eventData
        });
      }
    });

    return upcomingEvents;

  } catch (error) {
    console.error("Error getting upcoming events:", error);
    throw error;
  }
}

async function getRecentlyServedEvents(currentDate) {
  try {
    // Calculate the date 10 days ago
    const tenDaysAgo = new Date(currentDate);
    tenDaysAgo.setDate(currentDate.getDate() - 10);

    // Query events-served collection for events served in the last 10 days
    const servedCollection = collection(db, "events-served");
    const servedQuery = query(
      servedCollection,
      where("servedAt", ">=", Timestamp.fromDate(tenDaysAgo)),
      orderBy("servedAt", "desc")
    );

    const servedSnapshot = await getDocs(servedQuery);

    // Convert to array of documents
    const servedEvents = [];
    servedSnapshot.forEach((doc) => {
      servedEvents.push(doc);
    });

    return servedEvents;

  } catch (error) {
    console.error("Error getting recently served events:", error);
    return []; // Return empty array to continue processing
  }
}

// Alternative approach if you want to query by a specific date range
async function getServedEventsByDateRange(startDate, endDate) {
  try {
    const servedCollection = collection(db, "events-served");
    const servedQuery = query(
      servedCollection,
      where("servedAt", ">=", Timestamp.fromDate(startDate)),
      where("servedAt", "<=", Timestamp.fromDate(endDate)),
      orderBy("servedAt", "desc")
    );

    const servedSnapshot = await getDocs(servedQuery);

    const servedEvents = [];
    servedSnapshot.forEach((doc) => {
      servedEvents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return servedEvents;

  } catch (error) {
    console.error("Error getting served events by date range:", error);
    return [];
  }
}

// Function to get all historical served events (for reporting/history purposes)
async function getAllServedEvents(limitCount = 1000) {
  try {
    const servedCollection = collection(db, "events-served");
    const servedQuery = query(
      servedCollection,
      orderBy("servedAt", "desc"),
      limit(limitCount)
    );

    const servedSnapshot = await getDocs(servedQuery);

    const allServedEvents = [];
    servedSnapshot.forEach((doc) => {
      allServedEvents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return allServedEvents;

  } catch (error) {
    console.error("Error getting all served events:", error);
    throw error;
  }
}

// Function to get served events count by month for analytics
async function getServedEventsAnalytics() {
  try {
    const allServedEvents = await getAllServedEvents(5000); // Get more events for analytics

    const monthlyStats = {};

    allServedEvents.forEach(event => {
      const servedAt = event.servedAt?.toDate ? event.servedAt.toDate() : new Date(event.servedAt);
      const monthYear = `${servedAt.getFullYear()}-${String(servedAt.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = 0;
      }
      monthlyStats[monthYear]++;
    });

    return monthlyStats;

  } catch (error) {
    console.error("Error getting served events analytics:", error);
    throw error;
  }
}

// Usage examples:

// Regular usage - copy upcoming events without duplicates
copyUpcomingEventsMaintainHistory()
  .then((result) => {
    console.log("Events processing result:", result);
  })
  .catch((error) => {
    console.error("Failed to copy events:", error);
  });

// Get all historical served events for reporting
getAllServedEvents(100)
  .then((events) => {
    console.log("Historical served events:", events.length);
  })
  .catch((error) => {
    console.error("Failed to get served events:", error);
  });

// Get analytics
getServedEventsAnalytics()
  .then((stats) => {
    console.log("Served events analytics:", stats);
  })
  .catch((error) => {
    console.error("Failed to get analytics:", error);
  });

export {
  copyUpcomingEventsMaintainHistory,
  getAllServedEvents,
  getServedEventsAnalytics,
  getServedEventsByDateRange
};