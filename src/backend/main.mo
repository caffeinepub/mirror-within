import Array "mo:base/Array";

import Text "mo:base/Text";

persistent actor {

  type ConversationTurn = {
    role: Text;
    text: Text;
  };

  type JournalEntry = {
    id: Text;
    userId: Text;
    storyName: Text;
    inputMode: Text;
    summary: Text;
    entryPoint: Text;
    lens: Text;
    rawText: Text;
    aiReply: Text;
    conversationTurns: [ConversationTurn];
    emotions: [Text];
    triggers: [Text];
    beliefs: [Text];
    coping: [Text];
    primaryWound: Text;
    secondaryWound: Text;
    mirrorMode: Text;
    loopInterruption: Text;
    confidence: Text;
    timestamp: Int;
  };

  type FeedbackEntry = {
    id: Text;
    userName: Text;
    message: Text;
    screen: Text;
    createdAt: Text;
  };

  // Stable storage — plain arrays survive upgrades
  var stableJournalEntries: [(Text, [JournalEntry])] = [];
  var stableFeedbackEntries: [FeedbackEntry] = [];

  // Runtime index rebuilt from stable storage on postupgrade
  transient var journalIndex: [(Text, [JournalEntry])] = stableJournalEntries;

  system func preupgrade() {
    stableJournalEntries := journalIndex;
  };

  system func postupgrade() {
    journalIndex := stableJournalEntries;
  };

  // Helper: get entries for a userId
  func getForUser(userId: Text): [JournalEntry] {
    for ((uid, entries) in journalIndex.vals()) {
      if (uid == userId) return entries;
    };
    [];
  };

  // Helper: upsert entries for a userId
  func putForUser(userId: Text, entries: [JournalEntry]) {
    var found = false;
    journalIndex := Array.map<(Text, [JournalEntry]), (Text, [JournalEntry])>(
      journalIndex,
      func((uid, existing)) {
        if (uid == userId) {
          found := true;
          (uid, entries)
        } else {
          (uid, existing)
        }
      }
    );
    if (not found) {
      journalIndex := Array.append(journalIndex, [(userId, entries)]);
    };
  };

  // ── Journal entry functions ──────────────────────────────────────────────

  public func saveEntry(entry: JournalEntry): async () {
    let existing = getForUser(entry.userId);
    let filtered = Array.filter(existing, func(e: JournalEntry): Bool { e.id != entry.id });
    let updated = Array.append([entry], filtered);
    putForUser(entry.userId, updated);
  };

  public query func getEntries(userId: Text): async [JournalEntry] {
    let arr = getForUser(userId);
    Array.sort(arr, func(a: JournalEntry, b: JournalEntry): { #less; #equal; #greater } {
      if (a.timestamp > b.timestamp) #less
      else if (a.timestamp < b.timestamp) #greater
      else #equal
    })
  };

  public func deleteEntry(userId: Text, entryId: Text): async Bool {
    let existing = getForUser(userId);
    let filtered = Array.filter(existing, func(e: JournalEntry): Bool { e.id != entryId });
    if (filtered.size() == existing.size()) {
      false
    } else {
      putForUser(userId, filtered);
      true
    };
  };

  // ── Feedback functions ───────────────────────────────────────────────────

  public func saveFeedback(entry: FeedbackEntry): async () {
    stableFeedbackEntries := Array.append([entry], stableFeedbackEntries);
  };

  public query func getAllFeedback(): async [FeedbackEntry] {
    stableFeedbackEntries
  };

};
