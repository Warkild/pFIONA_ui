import React, { useEffect, useState } from 'react';
import { TailSpin } from 'react-loader-spinner';

// ExportSpec component
const ExportSpec = ({  }) => {
    const [deploymentData, setDeploymentData] = useState([]); // State to store deployment data
    const [loading, setLoading] = useState(true); // State to indicate loading
    const [exporting, setExporting] = useState(false); // State to indicate exporting
    const [exportingRawCsv, setExportingRawCsv] = useState(null); // State to indicate exporting raw CSV
    const [exportingRawJson, setExportingRawJson] = useState(null); // State to indicate exporting raw JSON
    const [exportingAbsorbanceCsv, setExportingAbsorbanceCsv] = useState(null); // State to indicate exporting absorbance CSV
    const [exportingAbsorbanceJson, setExportingAbsorbanceJson] = useState(null); // State to indicate exporting absorbance JSON
    const [exportingConcentrationCsv, setExportingConcentrationCsv] = useState(null); // State to indicate exporting concentration CSV
    const [exportingConcentrationJson, setExportingConcentrationJson] = useState(null); // State to indicate exporting concentration JSON
    const [confirmDelete, setConfirmDelete] = useState(null); // State to confirm deletion

    useEffect(() => {
        fetch(`/api/get_deployment_list?sensor_id=${sensor_id}`)
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                setDeploymentData(data); // Set the deployment data state
                setLoading(false); // Set loading state to false
            })
            .catch(error => {
                console.error("Error fetching data:", error); // Log error to console
                setLoading(false); // Set loading state to false
            });
    }, []);

    const handleExportRawData = (deploymentId, startTime, endTime) => {
        setExporting(true); // Set exporting state to true
        setExportingRawJson(deploymentId); // Set exporting raw JSON state
        const avgTimestamp = Math.floor((startTime + endTime) / 2); // Calculate the average timestamp
        const url = `/api/get_spectrums_in_deployment_full_info?sensor_id=${sensor_id}&timestamp=${avgTimestamp}`;

        fetch(url)
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                const jsonStr = JSON.stringify(data); // Convert data to JSON string
                const blob = new Blob([jsonStr], { type: "application/json" }); // Create a blob from the JSON string
                const url = URL.createObjectURL(blob); // Create a URL for the blob
                const link = document.createElement('a'); // Create a link element
                link.href = url;
                link.download = `spectrum_data_${avgTimestamp}.json`; // Set the download attribute
                document.body.appendChild(link); // Append the link to the body
                link.click(); // Click the link to start the download
                document.body.removeChild(link); // Remove the link from the body
                setExportingRawJson(null); // Reset exporting raw JSON state
                setExporting(false); // Set exporting state to false
            })
            .catch(error => {
                console.error("Error exporting data:", error); // Log error to console
                setExportingRawJson(null); // Reset exporting raw JSON state
                setExporting(false); // Set exporting state to false
            });
    };

    const handleExportRawCsvData = (deploymentId, startTime, endTime) => {
        setExporting(true); // Set exporting state to true
        setExportingRawCsv(deploymentId); // Set exporting raw CSV state
        const avgTimestamp = Math.floor((startTime + endTime) / 2); // Calculate the average timestamp
        const url = `/api/export_raw_spectra_csv?timestamp=${avgTimestamp}&sensor_id=${sensor_id}`;

        fetch(url)
            .then(response => response.blob()) // Parse the response as a blob
            .then(blob => {
                const url = URL.createObjectURL(blob); // Create a URL for the blob
                const link = document.createElement('a'); // Create a link element
                link.href = url;
                link.download = `spectrum_data_${avgTimestamp}.csv`; // Set the download attribute
                document.body.appendChild(link); // Append the link to the body
                link.click(); // Click the link to start the download
                document.body.removeChild(link); // Remove the link from the body
                setExportingRawCsv(null); // Reset exporting raw CSV state
                setExporting(false); // Set exporting state to false
            })
            .catch(error => {
                console.error("Error exporting data:", error); // Log error to console
                setExportingRawCsv(null); // Reset exporting raw CSV state
                setExporting(false); // Set exporting state to false
            });
    };

    const handleExportAbsorbanceData = (deploymentId, startTime, endTime) => {
        setExporting(true); // Set exporting state to true
        setExportingAbsorbanceJson(deploymentId); // Set exporting absorbance JSON state
        const avgTimestamp = Math.floor((startTime + endTime) / 2); // Calculate the average timestamp
        const url = `/api/get_absorbance_spectrums_in_deployment_full_info?sensor_id=${sensor_id}&timestamp=${avgTimestamp}`;

        fetch(url)
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                const jsonStr = JSON.stringify(data); // Convert data to JSON string
                const blob = new Blob([jsonStr], { type: "application/json" }); // Create a blob from the JSON string
                const url = URL.createObjectURL(blob); // Create a URL for the blob
                const link = document.createElement('a'); // Create a link element
                link.href = url;
                link.download = `absorbance_data_${avgTimestamp}.json`; // Set the download attribute
                document.body.appendChild(link); // Append the link to the body
                link.click(); // Click the link to start the download
                document.body.removeChild(link); // Remove the link from the body
                setExportingAbsorbanceJson(null); // Reset exporting absorbance JSON state
                setExporting(false); // Set exporting state to false
            })
            .catch(error => {
                console.error("Error exporting data:", error); // Log error to console
                setExportingAbsorbanceJson(null); // Reset exporting absorbance JSON state
                setExporting(false); // Set exporting state to false
            });
    };

    const handleExportAbsorbanceCsvData = (deploymentId, startTime, endTime) => {
        setExporting(true); // Set exporting state to true
        setExportingAbsorbanceCsv(deploymentId); // Set exporting absorbance CSV state
        const avgTimestamp = Math.floor((startTime + endTime) / 2); // Calculate the average timestamp
        const url = `/api/export_absorbance_spectra_csv?timestamp=${avgTimestamp}&sensor_id=${sensor_id}`;

        fetch(url)
            .then(response => response.blob()) // Parse the response as a blob
            .then(blob => {
                const url = URL.createObjectURL(blob); // Create a URL for the blob
                const link = document.createElement('a'); // Create a link element
                link.href = url;
                link.download = `absorbance_data_${avgTimestamp}.csv`; // Set the download attribute
                document.body.appendChild(link); // Append the link to the body
                link.click(); // Click the link to start the download
                document.body.removeChild(link); // Remove the link from the body
                setExportingAbsorbanceCsv(null); // Reset exporting absorbance CSV state
                setExporting(false); // Set exporting state to false
            })
            .catch(error => {
                console.error("Error exporting data:", error); // Log error to console
                setExportingAbsorbanceCsv(null); // Reset exporting absorbance CSV state
                setExporting(false); // Set exporting state to false
            });
    };

    // Function to handle exporting concentration data as JSON
    const handleExportConcentrationData = (deploymentId, startTime, endTime) => {
        setExporting(true); // Set exporting state to true
        setExportingConcentrationJson(deploymentId); // Set exporting concentration JSON state
        const avgTimestamp = Math.floor((startTime + endTime) / 2); // Calculate the average timestamp
        const url = `/api/get_concentration_for_deployment?sensor_id=${sensor_id}&timestamp=${avgTimestamp}`;

        fetch(url)
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                const jsonStr = JSON.stringify(data); // Convert data to JSON string
                const blob = new Blob([jsonStr], { type: "application/json" }); // Create a blob from the JSON string
                const url = URL.createObjectURL(blob); // Create a URL for the blob
                const link = document.createElement('a'); // Create a link element
                link.href = url;
                link.download = `concentration_data_${avgTimestamp}.json`; // Set the download attribute
                document.body.appendChild(link); // Append the link to the body
                link.click(); // Click the link to start the download
                document.body.removeChild(link); // Remove the link from the body
                setExportingConcentrationJson(null); // Reset exporting concentration JSON state
                setExporting(false); // Set exporting state to false
            })
            .catch(error => {
                console.error("Error exporting data:", error); // Log error to console
                setExportingConcentrationJson(null); // Reset exporting concentration JSON state
                setExporting(false); // Set exporting state to false
            });
    };

    // Function to handle exporting concentration data as CSV
    const handleExportConcentrationCsvData = (deploymentId, startTime, endTime) => {
        setExporting(true); // Set exporting state to true
        setExportingConcentrationCsv(deploymentId); // Set exporting concentration CSV state
        const avgTimestamp = Math.floor((startTime + endTime) / 2); // Calculate the average timestamp
        const url = `/api/export_concentration_csv?timestamp=${avgTimestamp}&sensor_id=${sensor_id}`;

        fetch(url)
            .then(response => response.blob()) // Parse the response as a blob
            .then(blob => {
                const url = URL.createObjectURL(blob); // Create a URL for the blob
                const link = document.createElement('a'); // Create a link element
                link.href = url;
                link.download = `concentration_data_${avgTimestamp}.csv`; // Set the download attribute
                document.body.appendChild(link); // Append the link to the body
                link.click(); // Click the link to start the download
                document.body.removeChild(link); // Remove the link from the body
                setExportingConcentrationCsv(null); // Reset exporting concentration CSV state
                setExporting(false); // Set exporting state to false
            })
            .catch(error => {
                console.error("Error exporting data:", error); // Log error to console
                setExportingConcentrationCsv(null); // Reset exporting concentration CSV state
                setExporting(false); // Set exporting state to false
            });
    };

    const handleDelete = (deploymentId) => {
        setConfirmDelete(deploymentId); // Set confirm delete state
        setTimeout(() => {
            setConfirmDelete(null); // Reset confirm delete state after 3 seconds
        }, 3000);
    };

    const confirmDeleteAction = (deploymentId) => {
        fetch(`/api/delete_spectrums?sensor_id=${sensor_id}&deployment_id=${deploymentId}`, {
            method: 'DELETE', // Send a DELETE request
        })
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                if (data.status === 'success') {
                    setDeploymentData(prevData => prevData.filter(deployment => deployment.deployment !== deploymentId)); // Filter out the deleted deployment
                } else {
                    console.error("Error deleting data:", data.message); // Log error to console
                }
                setConfirmDelete(null); // Reset confirm delete state
            })
            .catch(error => {
                console.error("Error deleting data:", error); // Log error to console
                setConfirmDelete(null); // Reset confirm delete state
            });
    };

    if (loading) {
        return <div>Loading...</div>; // Display loading message
    }

    return (
        <div className={"w-full"}>
            <div className={"mb-5"}>
                <h2 className={"font-poppins font-bold text-gray-500 text-sm"}>EXPORT SPECTROPHOTOMETER</h2> {/* Header for the component */}
            </div>
            <div className={"flex flex-col font-montserrat bg-white shadow-lg rounded-2xl py-7 px-8"}>
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="border border-custom-gray-1 bg-custom-gray-2">
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Deployment ID
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Start Date
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                End Date
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Export Raw Data
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Export Absorbance Data
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Export Concentration Data
                            </th>
                            <th className="font-montserrat font-medium pt-8 pb-2 pl-5 text-left">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    {deploymentData.map((deployment, index) => (
                        <tr key={index} className="border border-custom-gray-1">
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                {deployment.deployment}
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                {new Date(deployment.start_time * 1000).toLocaleString()}
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                {new Date(deployment.end_time * 1000).toLocaleString()}
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportRawCsvData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingRawCsv === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.csv'}
                                    </button>
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportRawData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingRawJson === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportAbsorbanceCsvData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingAbsorbanceCsv === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.csv'}
                                    </button>
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportAbsorbanceData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingAbsorbanceJson === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-6">
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportConcentrationCsvData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingConcentrationCsv === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.csv'}
                                    </button>
                                    <button className={`text-blue-600 ${exporting ? 'button-disabled text-gray-600' : ''}`} onClick={() => handleExportConcentrationData(deployment.deployment, deployment.start_time, deployment.end_time)} disabled={exporting}>
                                        {exportingConcentrationJson === deployment.deployment ? <TailSpin height={20} width={20} color="blue" /> : '.json'}
                                    </button>
                                </div>
                            </td>
                            <td className="font-montserrat font-medium text-gray-600 pb-2 pt-2 pl-5">
                                <div className="flex space-x-2">
                                    <button className={`text-red-700 ${exporting ? 'button-disabled text-gray-600': ''}`} disabled={exporting} onClick={() => confirmDelete === deployment.deployment ? confirmDeleteAction(deployment.deployment) : handleDelete(deployment.deployment)}>
                                        {confirmDelete === deployment.deployment ? 'Sure?' : 'Delete'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ExportSpec;
