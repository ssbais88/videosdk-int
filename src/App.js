import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  useConnection,
  usePubSub,
} from "@videosdk.live/react-sdk";
import { getToken } from "./api";
import { confirmAlert } from "react-confirm-alert"; // Import
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css
import { JoiningScreen } from "./components/JoiningScreen";
import ReactPlayer from "react-player";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  CssBaseline,
  Paper,
  Typography,
  useTheme,
} from "@material-ui/core";
import MicIcon from "@material-ui/icons/Mic";
import PhotoCameraIcon from "@material-ui/icons/PhotoCamera";
import ScreenShareIcon from "@material-ui/icons/ScreenShare";
import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";
import StopIcon from "@material-ui/icons/Stop";
import CallEndIcon from "@material-ui/icons/CallEnd";

const primary = "#3E84F6";

const width = 400;
const height = (width * 2) / 3;
const borderRadius = 8;

const chunk = (arr) => {
  const newArr = [];
  while (arr.length) newArr.push(arr.splice(0, 3));
  return newArr;
};

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

const Title = ({ title, dark }) => {
  return <h2 style={{ color: dark ? primary : "#fff" }}>{title}</h2>;
};

const ExternalVideo = () => {
  const [{ link, playing }, setVideoInfo] = useState({
    link: null,
    playing: false,
  });

  const onVideoStateChanged = (data) => {
    const { currentTime, link, status } = data;

    switch (status) {
      case "stopped":
        console.log("stopped in switch");
        externalPlayer.current.src = null;
        setVideoInfo({ link: null, playing: false });
        break;
      case "resumed":
        if (typeof currentTime === "number") {
          externalPlayer.current.currentTime = currentTime;
        }
        externalPlayer.current.play();
        setVideoInfo((s) => ({ ...s, playing: true }));
        break;
      case "paused":
        externalPlayer.current.pause();
        setVideoInfo((s) => ({ ...s, playing: false }));
        break;
      case "started":
        setVideoInfo({ link, playing: true });
        break;
      default:
        break;
    }
  };

  const onVideoSeeked = (data) => {
    const { currentTime } = data;
    if (typeof currentTime === "number") {
      externalPlayer.current.currentTime = currentTime;
    }
  };

  useMeeting({ onVideoStateChanged, onVideoSeeked });
  const externalPlayer = useRef();

  return !link ? null : (
    <div
      style={{
        borderRadius,
        padding: borderRadius,
        margin: borderRadius,
        backgroundColor: primary,
        display: "flex",
      }}
    >
      <Title title={"Externam Video"} />

      <video
        style={{ borderRadius, height, width, backgroundColor: "black" }}
        autoPlay
        ref={externalPlayer}
        src={link}
      />
    </div>
  );
};

const MessageList = ({ messages }) => {
  return (
    <div>
      {messages?.map((message, i) => {
        const { senderName, message: text, timestamp } = message;

        return (
          <div
            style={{
              margin: 8,
              backgroundColor: "darkblue",
              borderRadius: 8,
              overflow: "hidden",
              padding: 8,
              color: "#fff",
            }}
            key={i}
          >
            <p style={{ margin: 0, padding: 0, fontStyle: "italic" }}>
              {senderName}
            </p>
            <h3 style={{ margin: 0, padding: 0, marginTop: 4 }}>{text}</h3>
            <p
              style={{
                margin: 0,
                padding: 0,
                opacity: 0.6,
                marginTop: 4,
              }}
            >
              {formatAMPM(new Date(timestamp))}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const MeetingChat = ({ tollbarHeight }) => {
  const { publish, messages } = usePubSub("CHAT", {});
  const [message, setMessage] = useState("");
  return (
    <div
      style={{
        marginLeft: borderRadius,
        width: 300,
        backgroundColor: "#706694",
        overflowY: "scroll",
        borderRadius,
        height: `calc(100vh - ${tollbarHeight + 2 * borderRadius}px)`,
        padding: borderRadius,
      }}
    >
      <Typography variant="h5" style={{ marginBottom: "15px" }}>
        Chat
      </Typography>

      <div style={{ display: "flex" }}>
        <input
          value={message}
          onChange={(e) => {
            const v = e.target.value;
            setMessage(v);
          }}
          style={{ borderRadius: "5px", width: "300px" }}
          placeholder="Type your message here"
        />
        <Button
          style={{
            marginLeft: "25px",
            marginRight: 0,
            textAlign: "right",
          }}
          color="primary"
          variant="contained"
          onClick={() => {
            const m = message;

            if (m.length) {
              publish(m, { persist: true });
              setMessage("");
            }
          }}
        >
          Send
        </Button>
      </div>
      <MessageList messages={messages} />
    </div>
  );
};

const ParticipantView = ({ participantId }) => {
  const webcamRef = useRef(null);
  const micRef = useRef(null);
  const screenShareRef = useRef(null);

  const onStreamEnabled = (stream) => {};
  const onStreamDisabled = (stream) => {};

  const {
    displayName,
    participant,
    webcamStream,
    micStream,
    screenShareStream,
    webcamOn,
    micOn,
    screenShareOn,
    isLocal,
    isActiveSpeaker,
    isMainParticipant,
    switchTo,
    pinState,
    setQuality,
    enableMic,
    disableMic,
    enableWebcam,
    disableWebcam,
    pin,
    unpin,
  } = useParticipant(participantId, {
    onStreamEnabled,
    onStreamDisabled,
  });

  const webcamMediaStream = useMemo(() => {
    if (webcamOn) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  const screenShareMediaStream = useMemo(() => {
    if (screenShareOn) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(screenShareStream.track);
      return mediaStream;
    }
  }, [screenShareStream, screenShareOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) => console.error("mic  play() failed", error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div
      style={{
        width,
        backgroundColor: primary,
        borderRadius: borderRadius,
        overflow: "hidden",
        margin: borderRadius,
        padding: borderRadius,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        position: "relative",
      }}
    >
      <audio ref={micRef} autoPlay muted={isLocal} />

      <div
        style={{
          position: "relative",
          borderRadius: borderRadius,
          overflow: "hidden",
          backgroundColor: "black",
          width: "100%",
          height: "500px",
        }}
      >
        <div
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <>
            <ReactPlayer
              ref={webcamRef}
              //
              playsinline // very very imp prop
              playIcon={<></>}
              //
              pip={false}
              light={false}
              controls={false}
              muted={true}
              playing={true}
              //
              url={webcamMediaStream}
              //
              height={"100%"}
              width={"100%"}
              onError={(err) => {
                console.log(err, "participant video error");
              }}
            />
          </>
          <div
            style={{
              position: "absolute",
              top: borderRadius,
              right: borderRadius,
            }}
          >
            <p
              style={{
                color: webcamOn ? "green" : "red",
                fontSize: 16,
                fontWeight: "bold",
                opacity: 1,
              }}
            >
              WEB CAM
            </p>
          </div>

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
            }}
          >
            <Typography>{displayName}</Typography>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: borderRadius,
          position: "relative",
          borderRadius: borderRadius,
          overflow: "hidden",
          backgroundColor: "black",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <>
            <ReactPlayer
              ref={screenShareRef}
              //
              playsinline // very very imp prop
              playIcon={<></>}
              //
              pip={false}
              light={false}
              controls={false}
              muted={true}
              playing={true}
              //
              url={screenShareMediaStream}
              //
              height={"100%"}
              width={"100%"}
              onError={(err) => {
                console.log(err, "participant video error");
              }}
            />
          </>
          <div
            style={{
              position: "absolute",
              top: borderRadius,
              right: borderRadius,
            }}
          >
            <p
              style={{
                color: screenShareOn ? "green" : "red",
                fontSize: 16,
                fontWeight: "bold",
                opacity: 1,
              }}
            >
              SCREEN SHARING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParticipantsView = () => {
  const { participants } = useMeeting();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        padding: borderRadius,
      }}
    >
      <Title dark title={"Participants"} />
      {chunk([...participants.keys()]).map((k) => (
        <div style={{ display: "flex" }}>
          {k.map((l) => (
            <ParticipantView key={l} participantId={l} />
          ))}
        </div>
      ))}
    </div>
  );
};

const ConnectionView = ({ connectionId }) => {
  const { connection } = useConnection(connectionId, {
    onMeeting: {
      onChatMessage: ({ message, participantId }) => {
        alert(
          `A Person ${participantId} from ${connectionId} Wants to say : ${message}`
        );
      },
    },
  });

  const connectionParticipants = [...connection.meeting.participants.values()];

  const ConnectionParticipant = ({ participant }) => {
    return (
      <div style={{ padding: 4, border: "1px solid blue" }}>
        <p>{participant.displayName}</p>
        <button
          onClick={async () => {
            const meetingId = prompt(
              `In Which meetingId you want to switch ${participant.displayName} ?`
            );
            const payload = prompt("enter payload you want to pass");

            const token = await getToken();
            if ((meetingId, token, payload)) {
              participant
                .switchTo({ meetingId, token, payload })
                .catch(console.log);
            } else {
              alert("Empty meetingId or payload ");
            }
          }}
          className={"button "}
        >
          Switch
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        width,
        backgroundColor: primary,
        borderRadius: borderRadius,
        overflow: "hidden",
        margin: borderRadius,
        padding: borderRadius,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        position: "relative",
      }}
    >
      <button
        onClick={() => {
          connection.close();
        }}
        className={"button"}
      >
        Close Connection
      </button>

      <button
        onClick={() => {
          const message = prompt("Enter You Message");
          if (message) {
            connection.meeting.sendChatMessage(message);
          } else {
            alert("Empty Message ");
          }
        }}
        className={"button"}
      >
        Send Meessage
      </button>

      <button
        onClick={() => {
          connection.meeting.end();
        }}
        className={"button"}
      >
        End Meeting
      </button>
      <p>
        {connection.id} : {connection.payload}
      </p>
      {connectionParticipants.map((participant) => {
        return (
          <ConnectionParticipant
            key={`${connection.id}_${participant.id}`}
            participant={participant}
          />
        );
      })}
    </div>
  );
};

const ConnectionsView = () => {
  const { connections, meetingId } = useMeeting();
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        padding: borderRadius,
      }}
    >
      <Title dark title={"Connections"} />
      {chunk([...connections.keys()]).map((k) => (
        <div style={{ display: "flex" }} key={k}>
          {k.map((l) => (
            <ConnectionView key={`${meetingId}_${l}`} connectionId={l} />
          ))}
        </div>
      ))}
    </div>
  );
};

function MeetingView({ onNewMeetingIdToken, onMeetingLeave }) {
  const [participantViewVisible, setParticipantViewVisible] = useState(true);

  function onParticipantJoined(participant) {
    console.log(" onParticipantJoined", participant);
  }
  function onParticipantLeft(participant) {
    console.log(" onParticipantLeft", participant);
  }
  const onSpeakerChanged = (activeSpeakerId) => {
    console.log(" onSpeakerChanged", activeSpeakerId);
  };
  function onPresenterChanged(presenterId) {
    console.log(" onPresenterChanged", presenterId);
  }
  function onMainParticipantChanged(participant) {
    console.log(" onMainParticipantChanged", participant);
  }
  function onEntryRequested(participantId, name) {
    console.log(" onEntryRequested", participantId, name);
  }
  function onEntryResponded(participantId, name) {
    console.log(" onEntryResponded", participantId, name);
  }
  function onRecordingStarted() {
    console.log(" onRecordingStarted");
  }
  function onRecordingStopped() {
    console.log(" onRecordingStopped");
  }
  function onChatMessage(data) {
    console.log(" onChatMessage", data);
  }
  function onMeetingJoined() {
    console.log("onMeetingJoined");
  }
  function onMeetingLeft() {
    console.log("onMeetingLeft");
    onMeetingLeave();
  }
  const onLiveStreamStarted = (data) => {
    console.log("onLiveStreamStarted example", data);
  };
  const onLiveStreamStopped = (data) => {
    console.log("onLiveStreamStopped example", data);
  };

  const onVideoStateChanged = (data) => {
    console.log("onVideoStateChanged", data);
  };
  const onVideoSeeked = (data) => {
    console.log("onVideoSeeked", data);
  };

  const onWebcamRequested = (data) => {
    console.log("onWebcamRequested", data);
  };
  const onMicRequested = (data) => {
    console.log("onMicRequested", data);
  };
  const onPinStateChanged = (data) => {
    console.log("onPinStateChanged", data);
  };
  const onSwitchMeeting = (data) => {
    window.focus();
    confirmAlert({
      title: "Confirm to submit",
      message: "Are you sure you want to switch Meeting ?",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            onNewMeetingIdToken(data);
          },
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };

  const onConnectionOpen = (data) => {
    console.log("onConnectionOpen", data);
  };

  const {
    meetingId,
    meeting,
    localParticipant,
    mainParticipant,
    activeSpeakerId,
    participants,
    presenterId,
    localMicOn,
    localWebcamOn,
    localScreenShareOn,
    messages,
    isRecording,
    isLiveStreaming,
    pinnedParticipants,
    //
    join,
    leave,
    connectTo,
    end,
    //
    startRecording,
    stopRecording,
    //
    respondEntry,
    //
    muteMic,
    unmuteMic,
    toggleMic,
    //
    disableWebcam,
    enableWebcam,
    toggleWebcam,
    //
    disableScreenShare,
    enableScreenShare,
    toggleScreenShare,
    //
    getMics,
    getWebcams,
    changeWebcam,
    changeMic,

    startVideo,
    stopVideo,
    resumeVideo,
    pauseVideo,
    seekVideo,
    startLivestream,
    stopLivestream,
  } = useMeeting({
    onParticipantJoined,
    onParticipantLeft,
    onSpeakerChanged,
    onPresenterChanged,
    onMainParticipantChanged,
    onEntryRequested,
    onEntryResponded,
    onRecordingStarted,
    onRecordingStopped,
    onChatMessage,
    onMeetingJoined,
    onMeetingLeft,
    onLiveStreamStarted,
    onLiveStreamStopped,
    onVideoStateChanged,
    onVideoSeeked,
    onWebcamRequested,
    onMicRequested,
    onPinStateChanged,
    onSwitchMeeting,
    onConnectionOpen,
  });
  const [value, setValue] = React.useState(0);
  const theme = useTheme();

  const handleStartRecording = () => {
    startRecording();
  };
  const handleStopRecording = () => {
    stopRecording();
  };
  const confirmLeave = () => {
    leave();
  };

  const tollbarHeight = 120;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.palette.background.default,
          height: "100%",
        }}
      >
        <Typography variant="h3" style={{ color: "#706694" }}>
          Meeting ID: {meetingId}
        </Typography>
        <div style={{ display: "flex", flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              flex: 1,
              overflowY: "scroll",
              height: `calc(100vh - ${tollbarHeight}px)`,
            }}
          >
            <ExternalVideo />
            {/* <ParticipantsView /> */}
            {participantViewVisible ? (
              <ParticipantsView />
            ) : (
              <ConnectionsView />
            )}
          </div>
          <MeetingChat tollbarHeight={tollbarHeight} />
        </div>
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            overflow: "hidden",
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
          >
            <BottomNavigationAction
              label="Mic"
              icon={<MicIcon />}
              onClick={toggleMic}
            />
            <BottomNavigationAction
              label="Webcam"
              icon={<PhotoCameraIcon />}
              onClick={() => toggleWebcam()}
            />
            <BottomNavigationAction
              label="ScreenShare"
              icon={<ScreenShareIcon color="success" />}
              onClick={toggleScreenShare}
            />
            <BottomNavigationAction
              label="Start Recording"
              icon={<RadioButtonCheckedIcon />}
              onClick={handleStartRecording}
            />
            <BottomNavigationAction
              label="Stop Recording"
              icon={<StopIcon />}
              onClick={handleStopRecording}
            />
            <BottomNavigationAction
              label="End Call"
              icon={<CallEndIcon color="error" />}
              onClick={confirmLeave}
            />
          </BottomNavigation>
        </Paper>
      </div>
    </>
  );
}

const App = () => {
  const [token, setToken] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [webcamOn, setWebcamOn] = useState(false);
  const [isMeetingStarted, setMeetingStarted] = useState(false);

  return isMeetingStarted ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: micOn,
        webcamEnabled: webcamOn,
        name: participantName ? participantName : "TestUser",
      }}
      token={token}
      reinitialiseMeetingOnConfigChange={true}
      joinWithoutUserInteraction={true}
    >
      <MeetingView
        onNewMeetingIdToken={({ meetingId, token }) => {
          setMeetingId(meetingId);
          setToken(token);
        }}
        onMeetingLeave={() => {
          setToken("");
          setMeetingId("");
          setWebcamOn(false);
          setMicOn(false);
          setMeetingStarted(false);
        }}
      />
    </MeetingProvider>
  ) : (
    <JoiningScreen
      participantName={participantName}
      setParticipantName={setParticipantName}
      meetingId={meetingId}
      setMeetingId={setMeetingId}
      setToken={setToken}
      setMicOn={setMicOn}
      micOn={micOn}
      webcamOn={webcamOn}
      setWebcamOn={setWebcamOn}
      onClickStartMeeting={() => {
        setMeetingStarted(true);
      }}
      startMeeting={isMeetingStarted}
    />
  );
};

export default App;
