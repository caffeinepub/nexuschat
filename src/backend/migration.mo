module {
  type OldActor = {};

  type NewActor = {
    shutdownActive : Bool;
    shutdownReason : Text;
    shutdownEndsAt : Int;
    shutdownStartedAt : Int;
    shutdownStartedBy : Text;
  };

  public func run(old : OldActor) : NewActor {
    { old with shutdownActive = false; shutdownReason = ""; shutdownEndsAt = 0; shutdownStartedAt = 0; shutdownStartedBy = "" };
  };
};
