// 'use client';
// import { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import Head from 'next/head';

// const API_URL = 'http://localhost:5000/api';

// export default function Home() {
//     const [messages, setMessages] = useState([]);
//     const [input, setInput] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [chatState, setChatState] = useState('init');
//     const [isPasswordField, setIsPasswordField] = useState(false);
//     const [dbData, setDbData] = useState({
//         source_db: null,
//         target_db: null,
//         schemas: [],
//         tables: [],
//         results: null
//     });

//     const messagesEndRef = useRef(null);

//     // Scroll to bottom of chat
//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);

//     // Initial message on component mount
//     useEffect(() => {
//         initializeChat();
//     }, []);

//     const initializeChat = async () => {
//         setLoading(true);
//         try {
//             // Send an empty message to start the conversation
//             const response = await axios.post(`${API_URL}/chat`, {
//                 message: '',
//                 history: []
//             });

//             const responseData = response.data;
//             setChatState(responseData.state);

//             // Add the welcome message
//             setMessages([{ role: 'assistant', content: responseData.response }]);

//             // Handle special states that require UI changes
//             if (responseData.password_field) {
//                 setIsPasswordField(true);
//             } else {
//                 setIsPasswordField(false);
//             }

//         } catch (error) {
//             console.error('Error initializing chat:', error);
//             setMessages([
//                 {
//                     role: 'assistant',
//                     content: 'Welcome to the Database schema Migration! I encountered an error connecting to the server. Please try again later.'
//                 }
//             ]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const sendMessage = async () => {
//         if (!input.trim() && !loading) return;

//         // Add user message to chat
//         const userMessage = { role: 'user', content: isPasswordField ? '********' : input };
//         setMessages(prev => [...prev, userMessage]);

//         const actualInput = input; // Save input before clearing
//         setInput('');
//         setLoading(true);

//         try {
//             // Convert messages to history format for API
//             const history = messages.map(msg => ({
//                 user: msg.role === 'user' ? msg.content : '',
//                 assistant: msg.role === 'assistant' ? msg.content : ''
//             }));

//             // Send message to API
//             const response = await axios.post(`${API_URL}/chat`, {
//                 message: actualInput,
//                 history: history,
//                 state: chatState
//             });

//             // Handle response based on current state and next action
//             const responseData = response.data;
//             setChatState(responseData.state);

//             // Check if it's a password field
//             if (responseData.password_field) {
//                 setIsPasswordField(true);
//             } else {
//                 setIsPasswordField(false);
//             }

//             // Add AI response to chat
//             let assistantMessage = { role: 'assistant', content: responseData.response };

//             // Add UI components based on next_action
//             if (responseData.next_action === 'select_schema' && responseData.schemas) {
//                 assistantMessage.ui = 'schema_selector';
//                 assistantMessage.data = { schemas: responseData.schemas };
//             }
//             else if (responseData.next_action === 'select_tables' && responseData.tables) {
//                 assistantMessage.ui = 'table_selector';
//                 assistantMessage.data = { tables: responseData.tables };
//             }

//             setMessages(prev => [...prev, assistantMessage]);

//         } catch (error) {
//             console.error('Error sending message:', error);
//             setMessages(prev => [
//                 ...prev,
//                 { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
//             ]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const connectToSourceDB = async (connectionDetails) => {
//         setLoading(true);
//         try {
//             const response = await axios.post(`${API_URL}/source-connection`, {
//                 db_type: connectionDetails.db_type,
//                 connection_params: {
//                     host: connectionDetails.host,
//                     port: connectionDetails.port,
//                     database: connectionDetails.database,
//                     username: connectionDetails.username,
//                     password: connectionDetails.password
//                 }
//             });

//             if (response.data.success) {
//                 setSourceConnection({
//                     db_id: response.data.db_id,
//                     db_type: connectionDetails.db_type,
//                     host: connectionDetails.host,
//                     database: connectionDetails.database,
//                     schemas: response.data.schemas
//                 });

//                 // Add success message to chat
//                 setMessages(prev => [
//                     ...prev,
//                     {
//                         role: 'assistant',
//                         content: `Successfully connected to ${connectionDetails.db_type} database at ${connectionDetails.host}. Please select a schema from the right panel.`
//                     }
//                 ]);
//             } else {
//                 setMessages(prev => [
//                     ...prev,
//                     {
//                         role: 'assistant',
//                         content: `Failed to connect to database: ${response.data.message}`
//                     }
//                 ]);
//             }
//         } catch (error) {
//             console.error('Error connecting to database:', error);
//             setMessages(prev => [
//                 ...prev,
//                 {
//                     role: 'assistant',
//                     content: 'Sorry, there was an error connecting to the database.'
//                 }
//             ]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchTablesForSchema = async (schema) => {
//         if (!sourceConnection) return;

//         setLoading(true);
//         try {
//             const response = await axios.post(`${API_URL}/get-tables`, {
//                 db_id: sourceConnection.db_id,
//                 schema: schema
//             });

//             if (response.data.success) {
//                 setSelectedSchema(schema);
//                 setSchemaData({
//                     schema: schema,
//                     tables: response.data.tables
//                 });

//                 // Add message to chat
//                 setMessages(prev => [
//                     ...prev,
//                     {
//                         role: 'assistant',
//                         content: `Found ${response.data.tables.length} tables in schema "${schema}". Please select tables from the right panel.`
//                     }
//                 ]);
//             } else {
//                 setMessages(prev => [
//                     ...prev,
//                     {
//                         role: 'assistant',
//                         content: `Failed to retrieve tables: ${response.data.message}`
//                     }
//                 ]);
//             }
//         } catch (error) {
//             console.error('Error fetching tables:', error);
//             setMessages(prev => [
//                 ...prev,
//                 {
//                     role: 'assistant',
//                     content: 'Sorry, there was an error retrieving tables.'
//                 }
//             ]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const processSelectedTables = async (tables) => {
//         if (!sourceConnection || !selectedSchema) return;

//         setSelectedTables(tables);
//         setLoading(true);

//         try {
//             const response = await axios.post(`${API_URL}/selected-tables`, {
//                 db_id: sourceConnection.db_id,
//                 schema: selectedSchema,
//                 tables: tables
//             });

//             if (response.data.success) {
//                 setTableDetails(response.data);

//                 // Add message to chat
//                 setMessages(prev => [
//                     ...prev,
//                     {
//                         role: 'assistant',
//                         content: `Analysis of selected tables is complete. You can now connect to a target database or view the table details in the right panel.`
//                     }
//                 ]);
//             } else {
//                 setMessages(prev => [
//                     ...prev,
//                     {
//                         role: 'assistant',
//                         content: `Failed to process selected tables: ${response.data.message}`
//                     }
//                 ]);
//             }
//         } catch (error) {
//             console.error('Error processing tables:', error);
//             setMessages(prev => [
//                 ...prev,
//                 {
//                     role: 'assistant',
//                     content: 'Sorry, there was an error processing the selected tables.'
//                 }
//             ]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Extract database connection details from chat messages
//     const extractDBConnectionFromChat = (message) => {
//         // This is a simplified example, in reality you'd need more robust parsing
//         try {
//             // Look for a pattern like "postgresql://username:password@host:port/database"
//             const connectionString = message.match(/(\w+):\/\/[^@]+@([^:]+):(\d+)\/(\w+)/);
//             if (connectionString) {
//                 return {
//                     db_type: connectionString[1],
//                     host: connectionString[2],
//                     port: connectionString[3],
//                     database: connectionString[4]
//                 };
//             }

//             // Or look for individual components
//             const dbType = message.match(/database type:?\s*(\w+)/i);
//             const host = message.match(/host:?\s*([^\s,]+)/i);
//             const port = message.match(/port:?\s*(\d+)/i);
//             const database = message.match(/database:?\s*([^\s,]+)/i);
//             const username = message.match(/username:?\s*([^\s,]+)/i);
//             const password = message.match(/password:?\s*([^\s,]+)/i);

//             if (dbType && host && username) {
//                 return {
//                     db_type: dbType[1],
//                     host: host[1],
//                     port: port ? port[1] : '',
//                     database: database ? database[1] : '',
//                     username: username[1],
//                     password: password ? password[1] : ''
//                 };
//             }
//         } catch (e) {
//             console.error('Error parsing connection details:', e);
//         }

//         return null;
//     };

//     // Handle when user submits DB connection in chat
//     const handleDBConnection = (message) => {
//         const connectionDetails = extractDBConnectionFromChat(message);
//         if (connectionDetails) {
//             connectToSourceDB(connectionDetails);
//         }
//     };

//     const handleSchemaSelection = (schema) => {
//         setInput(schema);
//         sendMessage();
//     };

//     const handleTableSelection = (tables) => {
//         setInput(tables.join(', '));
//         sendMessage();
//     };

//     const handleKeyDown = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             sendMessage();
//         }
//     };

//     return (
//         <div className="flex flex-col h-screen bg-gray-100">
//             <Head>
//                 <title>Database schema Migration</title>
//                 <link rel="icon" href="/favicon.ico" />
//             </Head>

//             <header className="bg-blue-600 text-white p-4">
//                 <h1 className="text-2xl font-bold">Database schema Migration</h1>
//             </header>

//             <main className="flex-1 overflow-hidden flex flex-row p-4">
//                 {/* Left side: Chat interface */}
//                 <div className="w-1/2 pr-2 flex flex-col">
//                     <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg shadow p-4">
//                         {messages.map((message, index) => (
//                             <div
//                                 key={index}
//                                 className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
//                             >
//                                 <div
//                                     className={`inline-block p-3 rounded-lg ${message.role === 'user'
//                                         ? 'bg-blue-500 text-white'
//                                         : 'bg-gray-200 text-gray-800'
//                                     }`}
//                                 >
//                                     {message.content}
//                                 </div>

//                                 {/* Render UI components based on message type */}
//                                 {message.ui === 'schema_selector' && (
//                                     <div className="mt-2 p-3 border rounded-lg">
//                                         <p className="font-medium mb-2">Select a schema:</p>
//                                         <div className="flex flex-wrap gap-2">
//                                             {message.data.schemas.map((schema, i) => (
//                                                 <button
//                                                     key={i}
//                                                     className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
//                                                     onClick={() => handleSchemaSelection(schema)}
//                                                 >
//                                                     {schema}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}

//                                 {message.ui === 'table_selector' && (
//                                     <div className="mt-2 p-3 border rounded-lg">
//                                         <p className="font-medium mb-2">Select tables (click multiple):</p>
//                                         <div className="flex flex-wrap gap-2 mb-2">
//                                             {message.data.tables.map((table, i) => (
//                                                 <div key={i} className="flex items-center">
//                                                     <input
//                                                         type="checkbox"
//                                                         id={`table-${i}`}
//                                                         className="mr-1"
//                                                     />
//                                                     <label htmlFor={`table-${i}`} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded cursor-pointer">
//                                                         {table.name}
//                                                     </label>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                         <button
//                                             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//                                             onClick={() => {
//                                                 const selectedTables = Array.from(
//                                                     document.querySelectorAll('input[type="checkbox"]:checked')
//                                                 ).map(cb => {
//                                                     const index = cb.id.split('-')[1];
//                                                     return message.data.tables[index].name;
//                                                 });
//                                                 handleTableSelection(selectedTables);
//                                             }}
//                                         >
//                                             Confirm Selection
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                         {loading && (
//                             <div className="text-center">
//                                 <div className="inline-block p-3 bg-gray-200 rounded-lg">
//                                     <div className="flex items-center">
//                                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce mr-1"></div>
//                                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.2s' }}></div>
//                                         <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                         <div ref={messagesEndRef} />
//                     </div>

//                     <div className="flex">
//                         <input
//                             type={isPasswordField ? "password" : "text"}
//                             value={input}
//                             onChange={(e) => setInput(e.target.value)}
//                             onKeyDown={handleKeyDown}
//                             placeholder={isPasswordField ? "Enter password..." : "Type your message..."}
//                             className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             disabled={loading}
//                         />
//                         <button
//                             onClick={sendMessage}
//                             className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             disabled={loading}
//                         >
//                             Send
//                         </button>
//                     </div>
//                 </div>

               
//             </main>
//         </div>
//     );
// }
