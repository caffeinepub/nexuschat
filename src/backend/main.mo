import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Specify the data migration function in with-clause
(with migration = Migration.run)
persistent actor NexusChat {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserRole = { #owner; #admin; #member };

  type UserProfile = {
    principal_ : Principal;
    username : Text;
    role : UserRole;
    isBanned : Bool;
    isMuted : Bool;
    joinedAt : Int;
  };

  type Channel = {
    id : Nat;
    name : Text;
    createdBy : Text;
    createdAt : Int;
  };

  type Message = {
    id : Nat;
    channelId : Nat;
    authorPrincipal : Principal;
    authorUsername : Text;
    content : Text;
    timestamp : Int;
  };

  type Result<T> = { #ok : T; #err : Text };

  type ShutdownStatus = {
    active : Bool;
    reason : Text;
    endsAt : Int;
    startedAt : Int;
    startedBy : Text;
  };

  let users : Map.Map<Principal, UserProfile> = Map.empty();
  let usernameIndex : Map.Map<Text, Principal> = Map.empty();
  let channels : Map.Map<Nat, Channel> = Map.empty();
  let messages : Map.Map<Nat, [Message]> = Map.empty();
  var nextChannelId : Nat = 1;
  var nextMessageId : Nat = 1;
  var initialized : Bool = false;
  var shutdownActive : Bool = false;
  var shutdownReason : Text = "";
  var shutdownEndsAt : Int = 0;
  var shutdownStartedAt : Int = 0;
  var shutdownStartedBy : Text = "";

  func ensureInit() {
    if (not initialized) {
      let now = Time.now();
      let defaults = ["general", "announcements", "off-topic"];
      for (name in defaults.vals()) {
        let ch : Channel = { id = nextChannelId; name = name; createdBy = "system"; createdAt = now };
        channels.add(nextChannelId, ch);
        messages.add(nextChannelId, []);
        nextChannelId += 1;
      };
      initialized := true;
    };
  };

  public shared ({ caller }) func register(username : Text) : async Result<UserProfile> {
    ensureInit();
    if (caller.isAnonymous()) return #err("Must be authenticated");
    if (username.size() == 0 or username.size() > 32) return #err("Username must be 1-32 characters");
    switch (users.get(caller)) { case (?_) return #err("Already registered"); case null {} };
    switch (usernameIndex.get(username)) { case (?_) return #err("Username taken"); case null {} };
    let role : UserRole = if (username == "C.D") { #owner } else { #member };
    let profile : UserProfile = {
      principal_ = caller;
      username = username;
      role = role;
      isBanned = false;
      isMuted = false;
      joinedAt = Time.now();
    };
    users.add(caller, profile);
    usernameIndex.add(username, caller);
    #ok(profile);
  };

  public query ({ caller }) func isRegistered() : async Bool {
    switch (users.get(caller)) { case (?_) true; case null false }
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    users.get(caller);
  };

  public query func listUsers() : async [UserProfile] {
    users.values().toArray();
  };

  public query func listChannels() : async [Channel] {
    channels.values().toArray();
  };

  public query func getMessages(channelId : Nat, since : ?Int) : async [Message] {
    let msgs = switch (messages.get(channelId)) { case null []; case (?m) m };
    switch (since) {
      case null { msgs };
      case (?t) {
        msgs.filter(func(m : Message) : Bool { m.timestamp > t });
      };
    };
  };

  public shared ({ caller }) func sendMessage(channelId : Nat, content : Text) : async Result<Message> {
    ensureInit();
    let profile = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (profile.isBanned) return #err("You are banned");
    if (profile.isMuted) return #err("You are muted");
    if (content.size() == 0 or content.size() > 2000) return #err("Message must be 1-2000 characters");
    switch (channels.get(channelId)) { case null return #err("Channel not found"); case (?_) {} };
    let msg : Message = {
      id = nextMessageId;
      channelId = channelId;
      authorPrincipal = caller;
      authorUsername = profile.username;
      content = content;
      timestamp = Time.now();
    };
    nextMessageId += 1;
    let existing = switch (messages.get(channelId)) { case null [] ; case (?m) m };
    let updated = existing.concat([msg]);
    let trimmed = if (updated.size() > 200) {
      updated.sliceToArray(updated.size() - 200, updated.size());
    } else {
      updated;
    };
    messages.add(channelId, trimmed);
    #ok(msg);
  };

  public shared ({ caller }) func createChannel(name : Text) : async Result<Channel> {
    ensureInit();
    let profile = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (profile.role == #member) return #err("Admin or owner required");
    if (name.size() == 0 or name.size() > 32) return #err("Name must be 1-32 characters");
    let ch : Channel = {
      id = nextChannelId;
      name = name;
      createdBy = profile.username;
      createdAt = Time.now();
    };
    channels.add(nextChannelId, ch);
    messages.add(nextChannelId, []);
    nextChannelId += 1;
    #ok(ch);
  };

  public shared ({ caller }) func deleteChannel(channelId : Nat) : async Result<()> {
    let profile = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (profile.role != #owner) return #err("Owner only");
    switch (channels.get(channelId)) { case null return #err("Channel not found"); case (?_) {} };
    channels.remove(channelId);
    messages.remove(channelId);
    #ok(());
  };

  public shared ({ caller }) func deleteMessage(channelId : Nat, messageId : Nat) : async Result<()> {
    let profile = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (profile.role == #member) return #err("Admin or owner required");
    let msgs = switch (messages.get(channelId)) { case null return #err("Channel not found"); case (?m) m };
    messages.add(channelId, msgs.filter(func(m : Message) : Bool { m.id != messageId }));
    #ok(());
  };

  public shared ({ caller }) func banUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role == #member) return #err("Admin or owner required");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    if (tp.role == #owner) return #err("Cannot ban the owner");
    users.add(target, { tp with isBanned = true });
    #ok(());
  };

  public shared ({ caller }) func unbanUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role == #member) return #err("Admin or owner required");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    users.add(target, { tp with isBanned = false });
    #ok(());
  };

  public shared ({ caller }) func muteUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role == #member) return #err("Admin or owner required");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    if (tp.role == #owner) return #err("Cannot mute the owner");
    users.add(target, { tp with isMuted = true });
    #ok(());
  };

  public shared ({ caller }) func unmuteUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role == #member) return #err("Admin or owner required");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    users.add(target, { tp with isMuted = false });
    #ok(());
  };

  public shared ({ caller }) func kickUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role == #member) return #err("Admin or owner required");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    if (tp.role == #owner) return #err("Cannot kick the owner");
    users.remove(target);
    usernameIndex.remove(tp.username);
    #ok(());
  };

  public shared ({ caller }) func promoteUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role != #owner) return #err("Owner only");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    users.add(target, { tp with role = #admin });
    #ok(());
  };

  public shared ({ caller }) func demoteUser(target : Principal) : async Result<()> {
    let cp = switch (users.get(caller)) { case null return #err("Not registered"); case (?p) p };
    if (cp.role != #owner) return #err("Owner only");
    let tp = switch (users.get(target)) { case null return #err("User not found"); case (?p) p };
    if (tp.role == #owner) return #err("Cannot demote the owner");
    users.add(target, { tp with role = #member });
    #ok(());
  };

  public shared ({ caller }) func startShutdown(reason : Text, durationSeconds : Nat) : async Result<()> {
    switch (users.get(caller)) {
      case (?user) {
        if (user.role != #owner) { return #err("Only owner can start shutdown") };
        shutdownActive := true;
        shutdownReason := reason;
        shutdownEndsAt := Time.now() + durationSeconds * 1_000_000_000;
        shutdownStartedAt := Time.now();
        shutdownStartedBy := user.username;
        #ok(());
      };
      case (null) { #err("User not found") };
    };
  };

  public shared ({ caller }) func cancelShutdown() : async Result<()> {
    switch (users.get(caller)) {
      case (?user) {
        if (user.role != #owner) { return #err("Only owner can cancel shutdown") };
        shutdownActive := false;
        #ok(());
      };
      case (null) { #err("User not found") };
    };
  };

  public query func getShutdownStatus() : async ShutdownStatus {
    let now = Time.now();
    let active = if (shutdownActive and now > shutdownEndsAt) {
      false;
    } else {
      shutdownActive;
    };
    {
      active;
      reason = shutdownReason;
      endsAt = shutdownEndsAt;
      startedAt = shutdownStartedAt;
      startedBy = shutdownStartedBy;
    };
  };
};
