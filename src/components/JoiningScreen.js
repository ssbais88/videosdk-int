import {
  TextField,
  Box,
  Button,
  InputAdornment,
  useTheme,
  Grid,
  makeStyles,
  IconButton,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TableBody,
} from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import {
  Person,
  VideocamOff,
  MicOff,
  Mic,
  Videocam,
  ArrowBack,
} from "@material-ui/icons";
import useResponsiveSize from "../utils/useResponsiveSize";
import { red } from "@material-ui/core/colors";
import { MeetingDetailsScreen } from "./MeetingDetailsScreen";
import { createMeeting, getToken, validateMeeting } from "../api.js";
import EditIcon from "@material-ui/icons/Edit";

const useStyles = makeStyles((theme) => ({
  video: {
    borderRadius: "10px",
    backgroundColor: "#1c1c1c",
    height: "100%",
    width: "100%",
    objectFit: "cover",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  toggleButton: {
    borderRadius: "100%",
    minWidth: "auto",
    width: "44px",
    height: "44px",
  },

  previewBox: {
    width: "100%",
    height: "45vh",
    position: "relative",
  },
}));

const webStyle = {
  mainWrapper: {
    display: "flex",
    fontFamily: "Roboto-Medium",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: "30px",
    background: "#fff",
  },
  inputStyle: {
    width: "100%",
    height: "100px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  buttonStyle: {
    width: "20%",
    height: "45px",
    marginTop: "40px",
    border: "none",
    backgroundColor: "rgb(98, 0, 238)",
  },
  drawer: {
    width: "600",
  },
  modal: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
  },
  meetingModal: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  },
};

export function JoiningScreen({
  participantName,
  setParticipantName,
  meetingId,
  setMeetingId,
  setToken,
  setWebcamOn,
  setMicOn,
  micOn,
  webcamOn,
  onClickStartMeeting,
}) {
  const [readyToJoin, setReadyToJoin] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupData, setGroupData] = useState([
    {
      id: 1,
      group_name: "Admin",
      participant_name: "Participant 1",
      meeting_id: "8wp6-m5v1-5mx3",
      admin_id: "12334",
    },
    {
      id: 2,
      group_name: "Admin",
      participant_name: "Participant 2",
      meeting_id: "1234",
      admin_id: "12334",
    },
    {
      id: 3,
      group_name: "Admin",
      participant_name: "Participant 3",
      meeting_id: "1234",
      admin_id: "12334",
    },
    {
      id: 4,
      group_name: "Admin",
      participant_name: "Participant 4",
      meeting_id: "1234",
      admin_id: "12334",
    },
  ]);
  const [groupName, setGroupName] = useState("");
  const [userID, setUserID] = useState("");
  const [changeMeetingID, setChangeMeetingID] = useState("");
  const [adminID, setAdminID] = useState("");
  const videoPlayerRef = useRef();
  const theme = useTheme();
  const styles = useStyles(theme);

  const [videoTrack, setVideoTrack] = useState(null);

  const padding = useResponsiveSize({
    xl: 6,
    lg: 6,
    md: 6,
    sm: 4,
    xs: 1.5,
  });

  const changeScreenStates = (group, readyJoin) => {
    setShowGroupForm(group);
    setReadyToJoin(readyJoin);
  };

  const updateGroupData = (id) => {
    console.log("update Group called");
    const data = groupData.filter((val) => {
      return val.id == id;
    });
    const newData = groupData.filter((val) => {
      return val.id != id;
    });
    setGroupData(newData);
    setUserID(data[0].participant_name);
    setGroupName(data[0].group_name);
    setChangeMeetingID(data[0].meeting_id);
    setAdminID(data[0].admin_id);
  };

  const addUserData = () => {
    const id = groupData[groupData.length - 1].id + 1;
    const obj = {
      id: id,
      group_name: groupName,
      participant_name: userID,
      admin_id: adminID,
      meeting_id: changeMeetingID,
    };
    const newData = [...groupData, obj];
    setGroupData(newData);
    setGroupName("");
    setUserID("");
    setChangeMeetingID("");
    setAdminID("");
  };

  const _handleToggleMic = () => {
    setMicOn(!micOn);
  };
  const _handleToggleWebcam = () => {
    if (!webcamOn) {
      getVideo();
    } else {
      if (videoTrack) {
        videoTrack.stop();
        setVideoTrack(null);
      }
    }
    setWebcamOn(!webcamOn);
  };

  const getVideo = async () => {
    if (videoPlayerRef.current) {
      const videoConstraints = {
        video: {
          width: 1280,
          height: 720,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(
        videoConstraints
      );
      const videoTracks = stream.getVideoTracks();

      const videoTrack = videoTracks.length ? videoTracks[0] : null;

      videoPlayerRef.current.srcObject = new MediaStream([videoTrack]);
      videoPlayerRef.current.play();
      if (!videoTrack) {
        setWebcamOn(false);
      }
      setVideoTrack(videoTrack);
    }
  };

  useEffect(() => {
    if (webcamOn && !videoTrack) {
      getVideo();
    }
  }, [webcamOn]);

  return (
    <Box
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100vh",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
        padding: padding,
      }}
    >
      {readyToJoin ? (
        <Box
          position="absolute"
          style={{
            top: theme.spacing(2),
            right: 0,
            left: theme.spacing(2),
          }}
        >
          <IconButton
            onClick={() => {
              setReadyToJoin(false);
            }}
          >
            <ArrowBack />
          </IconButton>
        </Box>
      ) : null}
      <Grid
        item
        xs={12}
        md={6}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showGroupForm ? (
          <Box
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              height: "100%",
              alignItems: "center",
              backgroundColor: theme.palette.background.default,
              padding: padding,
              // marginTop: "350px",
            }}
          >
            <Typography variant="h6">Manage Group</Typography>
            <Box sx={webStyle.inputStyle}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Select Group
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  label="Select Group"
                  onChange={(e) => setGroupName(e.target.value)}
                  value={groupName}
                  // onChange={handleChange}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Dev">Dev</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={webStyle.inputStyle}>
              <TextField
                id="outlined-required"
                variant="outlined"
                value={userID}
                placeholder="Enter User Name"
                onChange={(e) => setUserID(e.target.value)}
              />
            </Box>
            <Box sx={webStyle.inputStyle}>
              <TextField
                id="outlined-required"
                variant="outlined"
                value={changeMeetingID}
                placeholder="Enter Meeting ID"
                onChange={(e) => setChangeMeetingID(e.target.value)}
              />
            </Box>
            <Box sx={webStyle.inputStyle}>
              <TextField
                id="outlined-required"
                variant="outlined"
                value={adminID}
                placeholder="Enter Admin ID"
                onChange={(e) => setAdminID(e.target.value)}
              />
            </Box>
            {/* <Box
              // m={6}
              style={{
                display: "flex",
                flex: 1,
                width: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // padding: padding,
              }}
            > */}
            <Button
              color="primary"
              variant="contained"
              onClick={() => addUserData()}
            >
              Add User
            </Button>
            {/* </Box> */}
            {/* <Box
              // m={6}
              style={{
                display: "flex",
                flex: 1,
                width: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // padding: padding,
              }}
            > */}
            <Button
              color="primary"
              variant="contained"
              onClick={() => changeScreenStates(false, true)}
              style={{ marginTop: "15px" }}
            >
              Back
            </Button>
            {/* </Box> */}
            <TableContainer component={Paper}>
              <Table
                stickyHeader
                aria-label="sticky table"
                style={{ width: "100%" }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Group Name</TableCell>
                    <TableCell align="center">Participant</TableCell>
                    <TableCell align="center">Meeting ID</TableCell>
                    <TableCell align="center">Admin ID</TableCell>
                    <TableCell align="center">Edit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupData.map((row) => (
                    <TableRow
                      key={row.id}
                      // sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" align="center">
                        {row.group_name}
                      </TableCell>
                      <TableCell align="center">
                        {row.participant_name}
                      </TableCell>
                      <TableCell align="center">{row.meeting_id}</TableCell>
                      <TableCell align="center">{row.admin_id}</TableCell>
                      <TableCell
                        align="center"
                        onClick={() => updateGroupData(row.id)}
                      >
                        <EditIcon />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : readyToJoin ? (
          <Box
            m={6}
            style={{
              display: "flex",
              flex: 1,
              width: "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: padding,
            }}
          >
            <Box className={styles.previewBox}>
              <video
                autoplay
                playsInline
                muted
                ref={videoPlayerRef}
                controls={false}
                className={styles.video + " flip"}
              />

              {!webcamOn ? (
                <Box
                  position="absolute"
                  style={{
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    right: 0,
                    left: 0,
                  }}
                >
                  <Typography>Camera is Turned Off</Typography>
                </Box>
              ) : null}

              <Box
                position="absolute"
                bottom={theme.spacing(2)}
                left="0"
                right="0"
              >
                <Grid
                  container
                  alignItems="center"
                  justify="center"
                  spacing={2}
                >
                  <Grid item>
                    <Tooltip
                      title={micOn ? "Turn off mic" : "Turn on mic"}
                      arrow
                      placement="top"
                    >
                      <Button
                        onClick={() => _handleToggleMic()}
                        variant="contained"
                        style={
                          micOn
                            ? {}
                            : {
                                backgroundColor: red[500],
                                color: "white",
                              }
                        }
                        className={styles.toggleButton}
                      >
                        {micOn ? <Mic /> : <MicOff />}
                      </Button>
                    </Tooltip>
                  </Grid>
                  <Grid item>
                    <Tooltip
                      title={webcamOn ? "Turn off camera" : "Turn on camera"}
                      arrow
                      placement="top"
                    >
                      <Button
                        onClick={() => _handleToggleWebcam()}
                        variant="contained"
                        style={
                          webcamOn
                            ? {}
                            : {
                                backgroundColor: red[500],
                                color: "white",
                              }
                        }
                        className={styles.toggleButton}
                      >
                        {webcamOn ? <Videocam /> : <VideocamOff />}
                      </Button>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Box>
            </Box>
            <TextField
              style={{
                width: "100%",
                marginTop: "1rem",
              }}
              id="outlined"
              label="Name"
              helperText={
                participantName.length < 3
                  ? "Enter Name with which you would like to join meeting"
                  : ""
              }
              onChange={(e) => {
                setParticipantName(e.target.value);
              }}
              variant="outlined"
              defaultValue={participantName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      disabled={participantName.length < 3}
                      color="primary"
                      variant="contained"
                      onClick={(e) => {
                        let validUser = groupData.filter((val) => {
                          return val.participant_name == participantName;
                        });
                        if (validUser.length !== 0) {
                          if (videoTrack) {
                            videoTrack.stop();
                            setVideoTrack(null);
                          }
                          onClickStartMeeting();
                        } else {
                          alert("Invalid Username!");
                        }
                      }}
                      id={"btnJoin"}
                    >
                      Start
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              color="primary"
              variant="contained"
              style={{ marginTop: "1rem" }}
              onClick={() => changeScreenStates(true, false)}
            >
              Manage Group
            </Button>
          </Box>
        ) : (
          <MeetingDetailsScreen
            onClickJoin={async (id) => {
              const token = await getToken();
              const valid = await validateMeeting({
                meetingId: id,
                token,
                groupData,
                participantName,
                changeMeetingID,
              });
              if (valid) {
                setReadyToJoin(true);
                setToken(token);
                setMeetingId(id);
                setWebcamOn(true);
                setMicOn(true);
              } else alert("Invalid Meeting Id");
            }}
            onClickCreateMeeting={async () => {
              const token = await getToken();
              const _meetingId = await createMeeting({ token });
              setToken(token);
              setMeetingId(_meetingId);
              setReadyToJoin(true);
              setWebcamOn(true);
              setMicOn(true);
            }}
          />
        )}
      </Grid>
    </Box>
  );
}
