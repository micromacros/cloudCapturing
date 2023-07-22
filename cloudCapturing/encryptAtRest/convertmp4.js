// https://github.com/atomdeniz/nodejs-mp4-to-hls

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs')
    //* Convert MP4 to HLS and DASH Formats
    convertMP4 = async function(inputVideoPath, name, callback){
        ffmpeg.setFfmpegPath(ffmpegInstaller.path);
        var videoFile = inputVideoPath;
        var filename = name;
        var HLSfolder = `./encryptAtRest/HLSConverted/${filename}`
        fs.mkdirSync(HLSfolder, { recursive: true });
        
        ffmpeg().input(videoFile)
        .output(`${HLSfolder}/${filename}.m3u8`) //* Manifest File
        .addOptions([
            '-profile:v main',
            '-vf scale=w=842:h=480:force_original_aspect_ratio=1,pad=842:480:(ow-iw)/2:(oh-ih)/2', //* Video Quality
            '-c:a aac',
            '-ar 48000',
            '-b:a 128k',
            '-c:v h264',
            '-crf 20',
            '-g 48',
            '-keyint_min 48',
            '-sc_threshold 0',
            '-b:v 1400k',
            '-maxrate 1498k',
            '-bufsize 2100k',
            '-hls_time 4',
            `-hls_segment_filename ${HLSfolder}/${filename}_%03d.ts`, //* Filename for Segments
            '-hls_playlist_type vod',
            '-f hls' //* HLS Format
        ])
        .on('end', () => {
            var DASHfolder = `./encryptAtRest/DASHConverted/${filename}`
            fs.mkdirSync(DASHfolder, { recursive: true });
            ffmpeg().input(videoFile)
            .output(`${DASHfolder}/${filename}.mpd`) //* Manifest File
            .addOptions([
                '-profile:v main',
                '-vf scale=w=842:h=480:force_original_aspect_ratio=1,pad=842:480:(ow-iw)/2:(oh-ih)/2', //* Video Quality
                '-preset:v medium',
                '-c:a aac',
                '-ar 48000',
                '-b:a 128k',
                '-c:v libx264',
                '-crf 20',
                '-g 48',
                '-keyint_min 48',
                '-sc_threshold 0',
                '-b:v 1400k',
                '-maxrate 1498k',
                '-bufsize 2100k',
                '-seg_duration 4',
                '-use_template 1',
                `-init_seg_name ${filename}-init-stream$RepresentationID$.mp4`,  //* Filename for initialisation stream
                `-media_seg_name ${filename}-chunk-stream$RepresentationID$-$Number%05d$.mp4`, //* Filename for Segments(2)
                '-f dash' //* DASH Format
            ])
            .on('end', () => {
                console.log('Conversion complete!');
                callback(null, HLSfolder, DASHfolder);
            })
            .on('error', (err) => {
                console.log(err, null, null)
            })
            .run();    
    
        })
        .run();
    }
    


module.exports = convertMP4;