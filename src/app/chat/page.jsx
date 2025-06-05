"use client";
import React from "react";
import { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Head from "next/head";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  IconButton,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import LockIcon from "@mui/icons-material/Lock";
import DnsIcon from "@mui/icons-material/Dns";
import StorageIcon from "@mui/icons-material/Storage";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios"; // Make sure axios is imported
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'; // Use PrismLight instead
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // Use CommonJS path instead of ESM

// Import Redux actions and selectors
import {
  setInput,
  addMessage,
  setLoading,
  setIsPasswordField,
  selectInput,
  selectMessages,
  selectLoading,
  selectIsPasswordField,
} from "../../redux/slices/chatSlice";

import {
  setCurrentTab,
  addSelectedTable,
  removeSelectedTable,
  resetConnectionState,
  setSourceConnection,
  setTargetConnection,
  setPipeline,
  setAvailableSchemas, // Make sure this is imported
  setAvailableTables, // Make sure this is imported
  selectSourceConnection,
  selectTargetConnection,
  selectPipeline,
  selectAvailableSchemas,
  selectAvailableTables,
  selectSelectedTables,
  selectCurrentTab,
} from "../../redux/slices/connectionSlice";

// Import thunks
import * as thunks from "../../redux/thunks";

const API_URL = "http://localhost:5000/api"; // Define API_URL here

// Create a theme
// Update your theme definition

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#64b5f6",
      lightest: "#e3f2fd", // Very light blue for backgrounds
    },
    secondary: {
      main: "#f50057",
      light: "#ff4081",
      lightest: "#fce4ec", // Very light pink for backgrounds
    },
    success: {
      main: "#4caf50",
      light: "#81c784",
      lightest: "#e8f5e9", // Very light green for backgrounds
    },
    warning: {
      main: "#ff9800",
      light: "#ffb74d",
      lightest: "#fff3e0", // Very light orange for backgrounds
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

export default function Home() {
  // Replace useState with useSelector
  const messages = useSelector(selectMessages);
  const input = useSelector(selectInput);
  const loading = useSelector(selectLoading);
  const isPasswordField = useSelector(selectIsPasswordField);

  // Connection state from Redux
  const sourceConnection = useSelector(selectSourceConnection);
  const targetConnection = useSelector(selectTargetConnection);
  const pipeline = useSelector(selectPipeline);
  const availableSchemas = useSelector(selectAvailableSchemas);
  const availableTables = useSelector(selectAvailableTables);
  const selectedTables = useSelector(selectSelectedTables);
  const currentTab = useSelector(selectCurrentTab);

  // renderTableSelection
  const [localCheckedTables, setLocalCheckedTables] = React.useState({});
  useEffect(() => {
    if (availableTables && availableTables.length > 0) {
      const initialCheckedState = {};
      availableTables.forEach((table) => {
        const tableName = typeof table === "string" ? table : table.name;
        initialCheckedState[tableName] = selectedTables.includes(tableName);
      });
      setLocalCheckedTables(initialCheckedState);
    }
  }, [availableTables, selectedTables]);

  const dispatch = useDispatch();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial message on component mount
  useEffect(() => {
    console.log("Initializing chat...");
    dispatch(thunks.initializeChat());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    dispatch(setCurrentTab(newValue));
  };

  // Handle input change
  const handleInputChange = (e) => {
    dispatch(setInput(e.target.value));
  };

  // Handle key down
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Update the sendMessage function to handle context reset
  const sendMessage = async () => {
    if (!input.trim() && !loading) return;

    // Add user message to chat
    const userMessage = {
      role: "user",
      content: isPasswordField ? "********" : input,
    };
    dispatch(addMessage(userMessage));

    const actualInput = input; // Save input before clearing
    dispatch(setInput(""));
    dispatch(setLoading(true));

    try {
      // Convert messages to history format for API
      const history = messages?.map((msg) => ({
        user: msg.role === "user" ? msg.content : "",
        assistant: msg.role === "assistant" ? msg.content : "",
      }));

      // Send message to API
      const response = await axios.post(`${API_URL}/chat`, {
        message: actualInput,
        history: history,
      });

      // Handle response
      const responseData = response.data;

      // Check if context has been reset for a new pipeline
      if (responseData.context_reset) {
        // Reset all frontend state for a new pipeline
        dispatch(resetConnectionState());
        dispatch(setIsPasswordField(false));
      } else {
        // Regular response handling (existing code)
        // Check if it's a password field
        if (responseData.password_field) {
          dispatch(setIsPasswordField(true));
        } else {
          dispatch(setIsPasswordField(false));
        }

        // Update connection state based on context
        updateConnectionStateFromResponse(responseData);
      }

      // Add AI response to chat
      let assistantMessage = {
        role: "assistant",
        content: responseData.response,
      };

      // Add UI components based on next_action
      if (
        responseData.next_action === "select_schema" &&
        responseData.schemas
      ) {
        assistantMessage.ui = "schema_selector";
        assistantMessage.data = { schemas: responseData.schemas };
        dispatch(setAvailableSchemas(responseData.schemas));
      } else if (
        responseData.next_action === "select_tables" &&
        responseData.tables
      ) {
        assistantMessage.ui = "table_selector";
        assistantMessage.data = { tables: responseData.tables };
        dispatch(setAvailableTables(responseData.tables));
      } else if (
        responseData.next_action === "confirm_pipeline" &&
        responseData.pipeline_summary
      ) {
        assistantMessage.ui = "pipeline_summary";
        assistantMessage.data = responseData.pipeline_summary;
      }

      dispatch(addMessage(assistantMessage));
    } catch (error) {
      console.error("Error sending message:", error);
      dispatch(
        addMessage({
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateConnectionStateFromResponse = (responseData) => {
    // Extract source connection information
    if (responseData.source_connection) {
      dispatch(
        setSourceConnection({
          connectionType: responseData.source_connection.type,
          connected: responseData.source_connection.connected,
          missingFields: responseData.source_connection.missing_fields || [],
          details: responseData.source_connection.provided_fields || {},
        })
      );
    }

    // Extract target connection information
    if (responseData.target_connection) {
      dispatch(
        setTargetConnection({
          connectionType: responseData.target_connection.type,
          connected: responseData.target_connection.connected,
          missingFields: responseData.target_connection.missing_fields || [],
          details: responseData.target_connection.provided_fields || {},
        })
      );
    }

    // Update pipeline type
    if (responseData.pipeline_type) {
      dispatch(
        setPipeline({
          type: responseData.pipeline_type,
        })
      );
    }

    // Update selected schema
    if (responseData.selected_schema) {
      dispatch(
        setPipeline({
          schema: responseData.selected_schema,
        })
      );
    }

    // Update selected tables
    if (responseData.selected_tables) {
      dispatch(
        setPipeline({
          tables: responseData.selected_tables,
        })
      );
    }

    // Update schemas and tables if available
    if (responseData.schemas) {
      dispatch(setAvailableSchemas(responseData.schemas));
    }

    if (responseData.tables) {
      dispatch(setAvailableTables(responseData.tables));
    }

    // Update pipeline ready status
    if (responseData.pipeline_summary) {
      dispatch(
        setPipeline({
          ready: true,
        })
      );
    }
  };

  // Extract connection details from message
  const extractConnectionDetails = (message) => {
    if (!message) return;

    // For PostgreSQL details
    const hostMatch = message.match(/host:?\s*([^\s,;]+)/i);
    const portMatch = message.match(/port:?\s*([^\s,;]+)/i);
    const dbMatch = message.match(/database:?\s*([^\s,;]+)/i);
    const userMatch = message.match(/username:?\s*([^\s,;]+)/i);
    const passwordMatch = message.match(/password:?\s*([^\s,;]+)/i);

    let sourceUpdates = {};
    if (hostMatch) sourceUpdates.host = hostMatch[1];
    if (portMatch) sourceUpdates.port = portMatch[1];
    if (dbMatch) sourceUpdates.database = dbMatch[1];
    if (userMatch) sourceUpdates.username = userMatch[1];
    if (passwordMatch) sourceUpdates.password = "********";

    // If any source updates were found, update state
    if (Object.keys(sourceUpdates).length > 0) {
      updateConnectionDetails(true, sourceUpdates);
    }

    // For ADLS details
    const accountMatch = message.match(/account[_\s]name:?\s*([^\s,;]+)/i);
    const containerMatch = message.match(/container[_\s]name:?\s*([^\s,;]+)/i);
    const directoryMatch = message.match(/directory[_\s]path:?\s*([^\s,;]+)/i);
    const tenantMatch = message.match(/tenant[_\s]id:?\s*([^\s,;]+)/i);
    const clientIdMatch = message.match(/client[_\s]id:?\s*([^\s,;]+)/i);
    const clientSecretMatch = message.match(
      /client[_\s]secret:?\s*([^\s,;]+)/i
    );

    let targetUpdates = {};
    if (accountMatch) targetUpdates.account_name = accountMatch[1];
    if (containerMatch) targetUpdates.container_name = containerMatch[1];
    if (directoryMatch) targetUpdates.directory_path = directoryMatch[1];
    if (tenantMatch) targetUpdates.tenant_id = tenantMatch[1];
    if (clientIdMatch) targetUpdates.client_id = clientIdMatch[1];
    if (clientSecretMatch) targetUpdates.client_secret = "********";

    // If any target updates were found, update state
    if (Object.keys(targetUpdates).length > 0) {
      updateConnectionDetails(false, targetUpdates);
    }
  };

  // Update connection details
  const updateConnectionDetails = (isSource, details) => {
    const target = isSource ? "source" : "target";

    // Update this method to use Redux dispatch instead of setConnectionState
    if (isSource) {
      dispatch(
        setSourceConnection({
          details: {
            ...sourceConnection.details,
            ...details,
          },
        })
      );
    } else {
      dispatch(
        setTargetConnection({
          details: {
            ...targetConnection.details,
            ...details,
          },
        })
      );
    }
  };
  // Replace direct state manipulation with Redux hooks
  const handleSchemaSelection = (schema) => {
    dispatch(thunks.handleSchemaSelection(schema));
  };

  const handleTableSelection = (tables) => {
    if (Array.isArray(tables) && tables.length > 0) {
      // Update Redux selectedTables state first
      tables.forEach((tableName) => {
        if (!selectedTables.includes(tableName)) {
          dispatch(addSelectedTable(tableName));
        }
      });

      // Then send the message via thunk
      dispatch(thunks.handleTableSelection(tables));
    }
  };

  const toggleTableSelection = (tableName) => {
    if (selectedTables.includes(tableName)) {
      dispatch(removeSelectedTable(tableName));
    } else {
      dispatch(addSelectedTable(tableName));
    }
  };

  // Extract credentials from messages as they come in
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        extractConnectionDetails(lastMessage.content);
      }
    }
  }, [messages]);

  const renderConnectionDetails = () => {
    // Get connection state from Redux selectors
    const sourceConnection = useSelector(selectSourceConnection);
    const targetConnection = useSelector(selectTargetConnection);
    const pipeline = useSelector(selectPipeline);

    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Pipeline Configuration</h2>

        {/* Source Connection */}
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex justify-between items-center border-b border-blue-200 pb-1 mb-2">
            <h3 className="font-semibold">Source Connection</h3>
            {sourceConnection.connected && (
              <span className="text-green-600 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Connected
              </span>
            )}
          </div>
          {sourceConnection.connectionType ? (
            <div>
              <div className="flex items-center mb-1">
                <strong className="mr-2">Type:</strong>
                <span className="px-2 py-1 bg-blue-100 rounded text-blue-800 text-sm">
                  {sourceConnection.connectionType.toUpperCase()}
                </span>
              </div>
              {Object.entries(sourceConnection.details)?.map(([key, value]) => (
                <div key={key} className="mb-1">
                  <strong>
                    {key.replace("_", " ").charAt(0).toUpperCase() +
                      key.slice(1)}
                    :
                  </strong>
                  {key.includes("password") ? (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                      ********
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                      {value}
                    </span>
                  )}
                </div>
              ))}
              <div className="mt-2">
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-0.5 rounded ${
                    sourceConnection.connected
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {sourceConnection.connected ? "Connected" : "Pending"}
                </span>
              </div>
              {sourceConnection.missingFields.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  <strong>Missing information:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {sourceConnection.missingFields?.map((field) => (
                      <li key={field}>{field.replace("_", " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">Not configured yet</div>
          )}
        </div>

        {/* Target Connection */}
        <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
          <div className="flex justify-between items-center border-b border-green-200 pb-1 mb-2">
            <h3 className="font-semibold">Target Connection</h3>
            {targetConnection.connected && (
              <span className="text-green-600 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Connected
              </span>
            )}
          </div>
          {targetConnection.connectionType ? (
            <div>
              <div className="flex items-center mb-1">
                <strong className="mr-2">Type:</strong>
                <span className="px-2 py-1 bg-green-100 rounded text-green-800 text-sm">
                  {targetConnection.connectionType.toUpperCase()}
                </span>
              </div>
              {Object.entries(targetConnection.details)?.map(([key, value]) => (
                <div key={key} className="mb-1">
                  <strong>
                    {key.replace("_", " ").charAt(0).toUpperCase() +
                      key.slice(1)}
                    :
                  </strong>
                  {key.includes("secret") ? (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                      ********
                    </span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                      {value}
                    </span>
                  )}
                </div>
              ))}
              <div className="mt-2">
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-0.5 rounded ${
                    targetConnection.connected
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {targetConnection.connected ? "Connected" : "Pending"}
                </span>
              </div>
              {targetConnection.missingFields.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  <strong>Missing information:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {targetConnection.missingFields?.map((field) => (
                      <li key={field}>{field.replace("_", " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">Not configured yet</div>
          )}
        </div>

        {/* Pipeline Status */}
        {pipeline.type && (
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <h3 className="font-semibold border-b border-purple-200 pb-1 mb-2">
              Pipeline Details
            </h3>
            <div className="flex items-center mb-1">
              <strong className="mr-2">Type:</strong>
              <span className="px-2 py-1 bg-purple-100 rounded text-purple-800 text-sm">
                {pipeline.type.toUpperCase()}
              </span>
            </div>
            {pipeline.schema && (
              <div className="mb-1">
                <strong>Schema:</strong>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                  {pipeline.schema}
                </span>
              </div>
            )}
            {pipeline.tables && pipeline.tables.length > 0 && (
              <div className="mb-1">
                <strong>Tables:</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {pipeline.tables?.map((table) => (
                    <span
                      key={table}
                      className="px-2 py-0.5 bg-gray-100 rounded text-sm"
                    >
                      {table}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2">
              <strong>Status:</strong>
              <span
                className={`ml-2 px-2 py-0.5 rounded ${
                  pipeline.ready
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {pipeline.ready ? "Ready" : "Configuring..."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update schema selection to use MUI components

  const renderSchemaSelection = () => {
    if (!availableSchemas || !availableSchemas.length) return null;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Available Schemas
        </Typography>
        <Grid
          container
          spacing={1}
          sx={{
            maxHeight: "15rem",
            overflow: "auto",
            p: 1,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
          }}
        >
          {availableSchemas?.map((schema, idx) => (
            <Grid item xs={6} key={idx}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  backgroundColor: "primary.lightest",
                  "&:hover": {
                    backgroundColor: "primary.light",
                  },
                }}
                onClick={() => handleSchemaSelection(schema)}
              >
                {schema}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Update table selection to use MUI components
  const renderTableSelection = () => {
    if (!availableTables || !availableTables.length) return null;

    // // Keep track of locally checked tables in a useRef to avoid re-renders
    // const [localCheckedTables, setLocalCheckedTables] = React.useState({});

    // // Initialize the state based on selectedTables from Redux
    // React.useEffect(() => {
    //   const initialCheckedState = {};
    //   availableTables.forEach((table, idx) => {
    //     const tableName = typeof table === "string" ? table : table.name;
    //     initialCheckedState[tableName] = selectedTables.includes(tableName);
    //   });
    //   setLocalCheckedTables(initialCheckedState);
    // }, [availableTables, selectedTables]);

    // Handle local checkbox changes
    const handleCheckboxChange = (tableName) => {
      setLocalCheckedTables((prev) => ({
        ...prev,
        [tableName]: !prev[tableName],
      }));
    };

    // Submit selected tables to Redux
    const submitTableSelection = () => {
      const selectedTableNames = Object.keys(localCheckedTables).filter(
        (tableName) => localCheckedTables[tableName]
      );

      // Update Redux state with selected tables
      handleTableSelection(selectedTableNames);
    };

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Available Tables
        </Typography>
        <Paper
          variant="outlined"
          sx={{ maxHeight: "15rem", overflow: "auto", mb: 2 }}
        >
          <List dense>
            {availableTables?.map((table, idx) => {
              const tableName = typeof table === "string" ? table : table.name;
              return (
                <ListItem
                  key={idx}
                  sx={{ py: 0.5, "&:hover": { bgcolor: "grey.100" } }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(localCheckedTables[tableName])}
                        onChange={() => handleCheckboxChange(tableName)}
                      />
                    }
                    label={tableName}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={submitTableSelection}
          disabled={!Object.values(localCheckedTables).some(Boolean)}
        >
          Confirm Table Selection
        </Button>
      </Box>
    );
  };

  // pipeline function
  const runPipeline = async () => {

    const userMessage = {
      role: "user",
      content: "Run the pipeline",
    };
    dispatch(addMessage(userMessage));

    // const actualInput = input; // Save input before clearing
    // dispatch(setInput(""));
    dispatch(setLoading(true));

      try {
      // Convert messages to history format for API
      const history = messages?.map((msg) => ({
        user: msg.role === "user" ? msg.content : "",
        assistant: msg.role === "assistant" ? msg.content : "",
      }));

      // Send message to API
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMessage?.content,
        history: history,
      });

      // Handle response
      const responseData = response.data;

      // Check if context has been reset for a new pipeline
      if (responseData.context_reset) {
        // Reset all frontend state for a new pipeline
        dispatch(resetConnectionState());
        dispatch(setIsPasswordField(false));
      } else {
        // Regular response handling (existing code)
        // Check if it's a password field
        if (responseData.password_field) {
          dispatch(setIsPasswordField(true));
        } else {
          dispatch(setIsPasswordField(false));
        }

        // Update connection state based on context
        updateConnectionStateFromResponse(responseData);
      }

            // Add AI response to chat
      let assistantMessage = {
        role: "assistant",
        content: responseData.response,
      };

      // Add UI components based on next_action
      if (
        responseData.next_action === "select_schema" &&
        responseData.schemas
      ) {
        assistantMessage.ui = "schema_selector";
        assistantMessage.data = { schemas: responseData.schemas };
        dispatch(setAvailableSchemas(responseData.schemas));
      } else if (
        responseData.next_action === "select_tables" &&
        responseData.tables
      ) {
        assistantMessage.ui = "table_selector";
        assistantMessage.data = { tables: responseData.tables };
        dispatch(setAvailableTables(responseData.tables));
      } else if (
        responseData.next_action === "confirm_pipeline" &&
        responseData.pipeline_summary
      ) {
        assistantMessage.ui = "pipeline_summary";
        assistantMessage.data = responseData.pipeline_summary;
      }

      dispatch(addMessage(assistantMessage));
    } catch (error) {
      console.error("Error running pipeline:", error);
      dispatch(
        addMessage({
          role: "assistant",
          content: "Sorry, there was an error running the pipeline.",
        })
      );
    }
      

  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div">
              Data Ingestion Assistant
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden", p: 2 }}>
          {/* Left side: Chat interface */}
          <Box
            sx={{
              width: "50%",
              pr: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Paper
              ref={chatContainerRef}
              sx={{
                flexGrow: 1,
                overflow: "auto",
                mb: 2,
                p: 2,
                display: "flex",
                flexDirection: "column",
              }}
              elevation={3}
            >
              {messages?.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent:
                      message.role === "user" ? "flex-end" : "flex-start",
                    alignItems: "flex-start",
                  }}
                >
                  {message.role === "assistant" && (
                    <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>AI</Avatar>
                  )}

                  <Box sx={{ maxWidth: "70%" }}>
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor:
                          message.role === "user" ? "primary.main" : "grey.100",
                        color:
                          message.role === "user" ? "white" : "text.primary",
                      }}
                    >
                      <CardContent
                        sx={{ py: 1, px: 2, "&:last-child": { pb: 1 } }}
                      >
                        {message.role === "user" ? (
                          <Typography variant="body1">{message.content}</Typography>
                        ) : (
                          <ReactMarkdown
                            components={{
                              // Optional: Configure syntax highlighting for code blocks
                              code({node, inline, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={tomorrow}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              // Style other elements as needed
                              p: ({node, ...props}) => <Typography variant="body1" {...props} />,
                              h1: ({node, ...props}) => <Typography variant="h5" gutterBottom fontWeight="bold" {...props} />,
                              h2: ({node, ...props}) => <Typography variant="h6" gutterBottom fontWeight="bold" {...props} />,
                              h3: ({node, ...props}) => <Typography variant="subtitle1" gutterBottom fontWeight="bold" {...props} />,
                              ul: ({node, ...props}) => <Box component="ul" sx={{ pl: 2 }} {...props} />,
                              ol: ({node, ...props}) => <Box component="ol" sx={{ pl: 2 }} {...props} />,
                              li: ({node, ...props}) => <Box component="li" sx={{ mb: 0.5 }} {...props} />,
                              a: ({node, ...props}) => <Box component="a" sx={{ color: 'primary.main', textDecoration: 'underline' }} {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </CardContent>
                    </Card>

                    {/* Render UI components based on message type */}
                    {message.ui === "schema_selector" && (
                      <Card sx={{ mt: 1 }} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Select a schema:
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                          >
                            {message.data.schemas?.map((schema, i) => (
                              <Chip
                                key={i}
                                label={schema}
                                onClick={() => handleSchemaSelection(schema)}
                                color="primary"
                                variant="outlined"
                                clickable
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    )}

                    {message.ui === "table_selector" && (
                      <Card sx={{ mt: 1 }} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Select tables:
                          </Typography>
                          <Box sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
                            <List dense>
                              {message.data.tables?.map((table, i) => (
                                <ListItem key={i} disablePadding>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={selectedTables.includes(
                                          table.name ? table.name : table
                                        )}
                                        onChange={() =>
                                          toggleTableSelection(
                                            table.name ? table.name : table
                                          )
                                        }
                                      />
                                    }
                                    label={table.name ? table.name : table}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleTableSelection}
                            disabled={selectedTables.length === 0}
                            fullWidth
                          >
                            Confirm Selection
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* {message.ui === "pipeline_summary" && (
                      <Card
                        sx={{ mt: 1, bgcolor: "success.light" }}
                        variant="outlined"
                      >
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Pipeline Configuration Complete:
                          </Typography>
                          <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ mb: 2 }}
                          >
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell component="th" scope="row">
                                    Source
                                  </TableCell>
                                  <TableCell>
                                    {message.data.source_type.toUpperCase()}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">
                                    Target
                                  </TableCell>
                                  <TableCell>
                                    {message.data.target_type.toUpperCase()}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">
                                    Schema
                                  </TableCell>
                                  <TableCell>{message.data.schema}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">
                                    Tables
                                  </TableCell>
                                  <TableCell>
                                    {message.data.tables.join(", ")}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CloudUploadIcon />}
                            fullWidth
                            onClick={runPipeline}
                          >
                            Run Pipeline
                          </Button>
                        </CardContent>
                      </Card>
                    )} */}
                  </Box>

                  {message.role === "user" && (
                    <Avatar sx={{ ml: 1, bgcolor: "secondary.main" }}>
                      {/* First letter of username or generic icon */}U
                    </Avatar>
                  )}
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Paper>

            <Box sx={{ display: "flex" }}>
              <TextField
                type={isPasswordField ? "password" : "text"}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isPasswordField ? "Enter password..." : "Type your message..."
                }
                fullWidth
                variant="outlined"
                disabled={loading}
                size="medium"
                InputProps={{
                  startAdornment: isPasswordField && (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
                color="white"
                bgcolor="primary.main"
                sx={{ flexGrow: 1, mr: 1, backgroundColor: "white" }}
              />
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={sendMessage}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                Send
              </Button>
            </Box>
          </Box>

          {/* Right side: Connection details */}
          <Paper
            sx={{
              width: "50%",
              pl: 0,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={3}
          >
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                aria-label="connection tabs"
              >
                <Tab label="Connection Details" />
                <Tab label="Pipeline Status" />
              </Tabs>
            </Box>

            {/* Connection Details Tab */}
            {currentTab === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Connection Configuration
                </Typography>

                {/* Source Connection Accordion */}
                <Accordion
                  defaultExpanded
                  sx={{
                    mb: 2,
                    bgcolor: "primary.lightest",
                    "&:before": { display: "none" }, // Remove the default divider
                    border: "1px solid",
                    borderColor: "primary.light",
                    borderRadius: "4px",
                    "& .MuiAccordionSummary-root": {
                      borderBottom: sourceConnection.connectionType
                        ? "1px solid"
                        : "none",
                      borderColor: "primary.light",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="source-connection-content"
                    id="source-connection-header"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        pr: 2,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        Source Connection
                      </Typography>
                      {sourceConnection.connected && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            color: "success.main",
                          }}
                        >
                          <CheckCircleIcon sx={{ mr: 0.5, fontSize: "1rem" }} />
                          <Typography variant="body2">Connected</Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {sourceConnection.connectionType ? (
                      <Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ mr: 1 }}
                          >
                            Type:
                          </Typography>
                          <Chip
                            label={sourceConnection.connectionType.toUpperCase()}
                            size="small"
                            color="primary"
                          />
                        </Box>

                        {Object.entries(sourceConnection.details)?.map(
                          ([key, value]) => (
                            <Box key={key} sx={{ mb: 0.5 }}>
                              <Typography
                                variant="body2"
                                component="span"
                                fontWeight="bold"
                              >
                                {key.replace("_", " ").charAt(0).toUpperCase() +
                                  key.slice(1)}
                                :
                              </Typography>
                              <Chip
                                label={
                                  key.includes("password") ? "********" : value
                                }
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          )
                        )}

                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            component="span"
                            fontWeight="bold"
                          >
                            Status:
                          </Typography>
                          <Chip
                            label={
                              sourceConnection.connected
                                ? "Connected"
                                : "Pending"
                            }
                            size="small"
                            color={
                              sourceConnection.connected ? "success" : "warning"
                            }
                            sx={{ ml: 1 }}
                          />
                        </Box>

                        {sourceConnection.missingFields.length > 0 && (
                          <Alert
                            severity="warning"
                            sx={{ mt: 1, fontSize: "0.875rem" }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              Missing information:
                            </Typography>
                            <ul
                              style={{
                                paddingLeft: "1.5rem",
                                marginTop: "0.25rem",
                              }}
                            >
                              {sourceConnection.missingFields?.map((field) => (
                                <li key={field}>{field.replace("_", " ")}</li>
                              ))}
                            </ul>
                          </Alert>
                        )}
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontStyle="italic"
                      >
                        Not configured yet
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Target Connection Accordion */}
                <Accordion
                  defaultExpanded
                  sx={{
                    mb: 2,
                    bgcolor: "success.lightest",
                    "&:before": { display: "none" }, // Remove the default divider
                    border: "1px solid",
                    borderColor: "success.light",
                    borderRadius: "4px",
                    "& .MuiAccordionSummary-root": {
                      borderBottom: targetConnection.connectionType
                        ? "1px solid"
                        : "none",
                      borderColor: "success.light",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="target-connection-content"
                    id="target-connection-header"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        pr: 2,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        Target Connection
                      </Typography>
                      {targetConnection.connected && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            color: "success.main",
                          }}
                        >
                          <CheckCircleIcon sx={{ mr: 0.5, fontSize: "1rem" }} />
                          <Typography variant="body2">Connected</Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {targetConnection.connectionType ? (
                      <Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ mr: 1 }}
                          >
                            Type:
                          </Typography>
                          <Chip
                            label={targetConnection.connectionType.toUpperCase()}
                            size="small"
                            color="secondary"
                          />
                        </Box>

                        {Object.entries(targetConnection.details)?.map(
                          ([key, value]) => (
                            <Box key={key} sx={{ mb: 0.5 }}>
                              <Typography
                                variant="body2"
                                component="span"
                                fontWeight="bold"
                              >
                                {key.replace("_", " ").charAt(0).toUpperCase() +
                                  key.slice(1)}
                                :
                              </Typography>
                              <Chip
                                label={
                                  key.includes("secret") ? "********" : value
                                }
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          )
                        )}

                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            component="span"
                            fontWeight="bold"
                          >
                            Status:
                          </Typography>
                          <Chip
                            label={
                              targetConnection.connected
                                ? "Connected"
                                : "Pending"
                            }
                            size="small"
                            color={
                              targetConnection.connected ? "success" : "warning"
                            }
                            sx={{ ml: 1 }}
                          />
                        </Box>

                        {targetConnection.missingFields.length > 0 && (
                          <Alert
                            severity="warning"
                            sx={{ mt: 1, fontSize: "0.875rem" }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              Missing information:
                            </Typography>
                            <ul
                              style={{
                                paddingLeft: "1.5rem",
                                marginTop: "0.25rem",
                              }}
                            >
                              {targetConnection.missingFields?.map((field) => (
                                <li key={field}>{field.replace("_", " ")}</li>
                              ))}
                            </ul>
                          </Alert>
                        )}
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontStyle="italic"
                      >
                        Not configured yet
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Pipeline Details Accordion */}
                {pipeline.type && (
                  <Accordion
                    defaultExpanded
                    sx={{
                      mb: 2,
                      bgcolor: "secondary.lightest",
                      "&:before": { display: "none" }, // Remove the default divider
                      border: "1px solid",
                      borderColor: "secondary.light",
                      borderRadius: "4px",
                      "& .MuiAccordionSummary-root": {
                        borderBottom: "1px solid",
                        borderColor: "secondary.light",
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="pipeline-details-content"
                      id="pipeline-details-header"
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        Pipeline Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ mr: 1 }}
                        >
                          Type:
                        </Typography>
                        <Chip
                          label={pipeline.type.toUpperCase()}
                          size="small"
                          color="secondary"
                        />
                      </Box>

                      {pipeline.schema && (
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="body2"
                            component="span"
                            fontWeight="bold"
                          >
                            Schema:
                          </Typography>
                          <Chip
                            label={pipeline.schema}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      )}

                      {pipeline.tables && pipeline.tables.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            Tables:
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            {pipeline.tables?.map((table) => (
                              <Chip
                                key={table}
                                label={table}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          component="span"
                          fontWeight="bold"
                        >
                          Status:
                        </Typography>
                        <Chip
                          label={pipeline.ready ? "Ready" : "Configuring..."}
                          size="small"
                          color={pipeline.ready ? "success" : "warning"}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Show the schema/table selectors when appropriate */}
                {sourceConnection.connected &&
                  !pipeline.schema &&
                  availableSchemas.length > 0 &&
                  renderSchemaSelection()}

                {pipeline.schema &&
                  pipeline.tables.length === 0 &&
                  availableTables.length > 0 &&
                  renderTableSelection()}
              </Box>
            )}

            {/* Pipeline Status Tab */}
            {currentTab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Pipeline Status
                </Typography>

                {pipeline.type ? (
                  <Box>
                    <Alert
                      severity={pipeline.ready ? "success" : "info"}
                      sx={{ mb: 2 }}
                    >
                      {pipeline.ready
                        ? "Pipeline is configured and ready to run"
                        : "Pipeline configuration in progress"}
                    </Alert>

                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Pipeline Type
                            </TableCell>
                            <TableCell>{pipeline.type.toUpperCase()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Schema
                            </TableCell>
                            <TableCell>
                              {pipeline.schema || "Not selected"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Tables
                            </TableCell>
                            <TableCell>
                              {pipeline.tables.length > 0
                                ? pipeline.tables.join(", ")
                                : "No tables selected"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Source Status
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  sourceConnection.connected
                                    ? "Connected"
                                    : "Not Connected"
                                }
                                color={
                                  sourceConnection.connected
                                    ? "success"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">
                              Target Status
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  targetConnection.connected
                                    ? "Connected"
                                    : "Not Connected"
                                }
                                color={
                                  targetConnection.connected
                                    ? "success"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {pipeline.ready && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Run Pipeline
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No pipeline has been configured yet. Start by specifying the
                    pipeline type in the chat.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
