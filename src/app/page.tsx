"use client"
import {useState} from "react";
import Papa from "papaparse";
import {CSVLink} from "react-csv";
function getHidersAndSeekersFromParsedData(data: any) {
    const hiders = data.filter((row: any) => row["participant.role"] === 'hider');
    const seekers = data.filter((row: any) => row["participant.role"] === 'seeker');
    return {hiders, seekers}
}

function getSetsOrder(row: any) {
    const str = row["board.1.player.multipliers_sets_order"]
    const validJson = str.replace(/'/g, '"')
    const setsOrder = JSON.parse(validJson)
    return setsOrder
}

const getPlayersByIdInSession = (data: any) => {
    return data.reduce((acc: any, row: any) => {
        const playerId = row["participant.id_in_session"];
        acc[playerId] = (row);
        return acc;
    }, {})
}
const getSetPermutationByRound = (row: any, round: number) => {
    const setPermutationStr = row[`board.${round}.player.set_permutation`];
    const validJson = setPermutationStr.replace(/'/g, '"')
    const setPermutation = JSON.parse(validJson)
    return setPermutation
}

export default function Home() {
    const [outputData, setOutputData] = useState<any>(null);
    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true, // Assuming the first row contains headers
                dynamicTyping: true, // Automatically detect data types
                complete: (result) => {
                    const {hiders, seekers} = getHidersAndSeekersFromParsedData(result.data);
                    const hidersByIdInSession = getPlayersByIdInSession(hiders);
                    const seekersByIdInSession = getPlayersByIdInSession(seekers);
                    const numberOfCouples = Math.min(Object.keys(hidersByIdInSession).length, Object.keys(seekersByIdInSession).length);
                    const output : {"idInSession" : number, "hiderPoints" : number, "seekerPoints" : number}[] = []
                    for (let i = 0; i < numberOfCouples; i++) {
                        let hiderPoints = 0
                        let seekerPoints = 0
                        const hiderSetOrder = getSetsOrder(hiders[i]);
                        const seekerSetOrder = getSetsOrder(seekers[i]);
                        const hiderRoundWithSetC = hiderSetOrder.findIndex((set: any) => set === 'c') + 1;
                        const seekerRoundWithSetC = seekerSetOrder.findIndex((set: any) => set === 'c') + 1;
                        const hiderSetPermutation = getSetPermutationByRound(hiders[i], hiderRoundWithSetC );
                        const seekerSetPermutation = getSetPermutationByRound(seekers[i], seekerRoundWithSetC );
                        const hiderIndexOfOne = hiderSetPermutation.findIndex((set: any) => set === 1);
                        const seekerIndexOfOne = seekerSetPermutation.findIndex((set: any) => set === 1);
                        const hiderIndexOfTwo = hiderSetPermutation.findIndex((set: any) => set === 2);
                        const seekerIndexOfTwo = seekerSetPermutation.findIndex((set: any) => set === 2);
                        const hiderIndexOfThree = hiderSetPermutation.findIndex((set: any) => set === 3);
                        const seekerIndexOfThree = seekerSetPermutation.findIndex((set: any) => set === 3);
                        const hiderIndexOfFour = hiderSetPermutation.findIndex((set: any) => set === 4);
                        const seekerIndexOfFour = seekerSetPermutation.findIndex((set: any) => set === 4);
                        const hiderDict: {[key : number] :  string} = {
                            1: hiders[i][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfOne}_number_of_objects`],
                            2: hiders[i][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfTwo}_number_of_objects`],
                            3: hiders[i][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfThree}_number_of_objects`],
                            4: hiders[i][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfFour}_number_of_objects`],
                        }
                        const seekerDict :{[key : number] :  "TRUE" | "FALSE"}= {
                            1: seekers[i][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfOne}_is_selected`],
                            2: seekers[i][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfTwo}_is_selected`],
                            3: seekers[i][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfThree}_is_selected`],
                            4: seekers[i][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfFour}_is_selected`],
                        }
                        for (let j = 1; j <= 4; j++) {
                            if (seekerDict[j] === "TRUE"){
                                seekerPoints += parseInt(hiderDict[j]) * j
                            }
                            else{
                                hiderPoints += parseInt(hiderDict[j]) * j
                            }
                        }
                        output.push({"idInSession" : i+1, "hiderPoints" : hiderPoints, "seekerPoints" : seekerPoints})
                    }
                    setOutputData(output);
                },
                error: (error) => {
                    console.error('CSV parsing error:', error.message);
                },
            });
        }
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1>Upload csv</h1>
            <div className="flex flex-col items-center justify-center">
                <input type="file" accept=".csv" onChange={handleFileUpload}/>
            </div>
            {outputData && <CSVLink filename={`jayk-matching-result-${dateStr}`} data={outputData} >Download me</CSVLink>}
        </main>
    )
}
