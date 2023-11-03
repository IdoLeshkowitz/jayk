"use client"
import {useState} from "react";
import Papa from "papaparse";
import {CSVLink} from "react-csv";
import {debug} from "util";

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

function getSeekersResults(seekers: any, hiders: any) {
    const seekersResults: any[] = [];
    for (let i = 0; i < Object.keys(seekers).length; i++) {
        const seekerId = Object.keys(seekers)[i];
        const seekerSetOrder = getSetsOrder(seekers[seekerId]);
        const seekerRoundWithSetC = seekerSetOrder.findIndex((set: any) => set === 'c') + 1;
        const seekerSetPermutation = getSetPermutationByRound(seekers[seekerId], seekerRoundWithSetC);
        const seekerIndexOfOne = seekerSetPermutation.findIndex((set: any) => set === 1);
        const seekerIndexOfTwo = seekerSetPermutation.findIndex((set: any) => set === 2);
        const seekerIndexOfThree = seekerSetPermutation.findIndex((set: any) => set === 3);
        const seekerIndexOfFour = seekerSetPermutation.findIndex((set: any) => set === 4);
        const seekerDict: { [key: number]: boolean } = {
            1: seekers[seekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfOne}_is_selected`],
            2: seekers[seekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfTwo}_is_selected`],
            3: seekers[seekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfThree}_is_selected`],
            4: seekers[seekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfFour}_is_selected`],
        }
        const randomHiderId = Object.keys(hiders)[Math.floor(Math.random() * Object.keys(hiders).length)];
        const hiderSetOrder = getSetsOrder(hiders[randomHiderId]);
        const hiderRoundWithSetC = hiderSetOrder.findIndex((set: any) => set === 'c') + 1;
        const hiderSetPermutation = getSetPermutationByRound(hiders[randomHiderId], hiderRoundWithSetC);
        const hiderIndexOfOne = hiderSetPermutation.findIndex((set: any) => set === 1);
        const hiderIndexOfTwo = hiderSetPermutation.findIndex((set: any) => set === 2);
        const hiderIndexOfThree = hiderSetPermutation.findIndex((set: any) => set === 3);
        const hiderIndexOfFour = hiderSetPermutation.findIndex((set: any) => set === 4);
        const hiderDict: { [key: number]: string } = {
            1: hiders[randomHiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfOne}_number_of_objects`],
            2: hiders[randomHiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfTwo}_number_of_objects`],
            3: hiders[randomHiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfThree}_number_of_objects`],
            4: hiders[randomHiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfFour}_number_of_objects`],
        }
        let seekerPoints = 0
        let hiderPoints = 0
        for (let j = 1; j <= 4; j++) {
            if (seekerDict[j] === true) {
                hiderPoints += parseInt(hiderDict[j]) * j
            } else {
                seekerPoints += parseInt(hiderDict[j]) * j
            }
        }
        seekersResults.push({
            "leading_participant_prolific_id": seekers[seekerId]["participant.label"],
            "leading_participant_participant_code": seekers[seekerId]["participant.code"],
            "leading_participant_role": seekers[seekerId]["participant.role"],
            "matched_participant_prolific_id": hiders[randomHiderId]["participant.label"],
            "matched_participant_participant_code": hiders[randomHiderId]["participant.code"],
            "hider_allocations": [hiderDict[1], hiderDict[2], hiderDict[3], hiderDict[4]],
            "allocations_values": [hiderDict[1], hiderDict[2], hiderDict[3], hiderDict[4]].map((val: any, index) => parseInt(val) * (index + 1)),
            "seeker_opened_boxes": [seekerDict[1], seekerDict[2], seekerDict[3], seekerDict[4]],
            "hider_earnings": hiderPoints,
            "seeker_earnings": seekerPoints,
            "leading_participant_earnings": seekerPoints,
        })

    }
    return seekersResults
}

function getHidersResults(seekers: any, hiders: any) {
    const hidersResults: any[] = [];
    for (let i = 0; i < Object.keys(hiders).length; i++) {
        const hiderId = Object.keys(hiders)[i];
        const hiderSetOrder = getSetsOrder(hiders[hiderId]);
        const hiderRoundWithSetC = hiderSetOrder.findIndex((set: any) => set === 'c') + 1;
        const hiderSetPermutation = getSetPermutationByRound(hiders[hiderId], hiderRoundWithSetC);
        const hiderIndexOfOne = hiderSetPermutation.findIndex((set: any) => set === 1);
        const hiderIndexOfTwo = hiderSetPermutation.findIndex((set: any) => set === 2);
        const hiderIndexOfThree = hiderSetPermutation.findIndex((set: any) => set === 3);
        const hiderIndexOfFour = hiderSetPermutation.findIndex((set: any) => set === 4);
        const hiderDict: { [key: number]: string } = {
            1: hiders[hiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfOne}_number_of_objects`],
            2: hiders[hiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfTwo}_number_of_objects`],
            3: hiders[hiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfThree}_number_of_objects`],
            4: hiders[hiderId][`board.${hiderRoundWithSetC}.player.box${hiderIndexOfFour}_number_of_objects`],
        }
        const randomSeekerId = Object.keys(seekers)[Math.floor(Math.random() * Object.keys(seekers).length)];
        const seekerSetOrder = getSetsOrder(seekers[randomSeekerId]);
        const seekerRoundWithSetC = seekerSetOrder.findIndex((set: any) => set === 'c') + 1;
        const seekerSetPermutation = getSetPermutationByRound(seekers[randomSeekerId], seekerRoundWithSetC);
        const seekerIndexOfOne = seekerSetPermutation.findIndex((set: any) => set === 1);
        const seekerIndexOfTwo = seekerSetPermutation.findIndex((set: any) => set === 2);
        const seekerIndexOfThree = seekerSetPermutation.findIndex((set: any) => set === 3);
        const seekerIndexOfFour = seekerSetPermutation.findIndex((set: any) => set === 4);
        const seekerDict: { [key: number]: boolean } = {
            1: seekers[randomSeekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfOne}_is_selected`],
            2: seekers[randomSeekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfTwo}_is_selected`],
            3: seekers[randomSeekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfThree}_is_selected`],
            4: seekers[randomSeekerId][`board.${seekerRoundWithSetC}.player.box${seekerIndexOfFour}_is_selected`],
        }
        let seekerPoints = 0
        let hiderPoints = 0
        for (let j = 1; j <= 4; j++) {
            if (seekerDict[j] === true) {
                seekerPoints += parseInt(hiderDict[j]) * j
            } else {
                hiderPoints += parseInt(hiderDict[j]) * j
            }
        }
        hidersResults.push({
            "leading_participant_prolific_id": hiders[hiderId]["participant.label"],
            "leading_participant_participant_code": hiders[hiderId]["participant.code"],
            "leading_participant_role": hiders[hiderId]["participant.role"],
            "matched_participant_prolific_id": seekers[randomSeekerId]["participant.label"],
            "matched_participant_participant_code": seekers[randomSeekerId]["participant.code"],
            "hider_allocations": [hiderDict[1], hiderDict[2], hiderDict[3], hiderDict[4]],
            "allocations_values": [hiderDict[1], hiderDict[2], hiderDict[3], hiderDict[4]].map((val: any, index) => parseInt(val) * (index + 1)),
            "seeker_opened_boxes": [seekerDict[1], seekerDict[2], seekerDict[3], seekerDict[4]],
            "hider_earnings": hiderPoints,
            "seeker_earnings": seekerPoints,
            "leading_participant_earnings": hiderPoints,
        })
    }
    return hidersResults
}

export default function Home() {
    const [hiderResults, setHiderResults] = useState<any[]| null>(null);
    const [seekerResults, setSeekerResults] = useState<any[] | null>(null);
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
                    const seekersResults = getSeekersResults(seekersByIdInSession, hidersByIdInSession);
                    const hidersResults = getHidersResults(seekersByIdInSession, hidersByIdInSession);
                    debugger
                    setSeekerResults(seekersResults);
                    setHiderResults(hidersResults);
                }, error: (error) => {
                    console.error('CSV parsing error:', error.message);
                },
            });
        }
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    return (<main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1>Upload csv</h1>
        <div className="flex flex-col items-center justify-center">
            <input type="file" accept=".csv" onChange={handleFileUpload}/>
        </div>
        {hiderResults &&
        <CSVLink filename={`jayk-matching-result-${dateStr}`} data={hiderResults}>Hiders table</CSVLink>}
        {seekerResults &&
        <CSVLink filename={`jayk-matching-result-${dateStr}`} data={seekerResults}>Seekers table</CSVLink>}
    </main>)
}
